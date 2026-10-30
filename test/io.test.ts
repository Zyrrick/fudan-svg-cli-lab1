import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { Editor } from '../src/application/Editor.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { NodeFilePort } from '../src/io/NodeFilePort.js';
import { mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('SVG reserves later explicit ids, restores entities and roundtrips nested groups', () => {
  const codec = new SvgCodec();
  const result = codec.decode('<svg width="400" height="300"><g id="G"><rect/><rect id="rect1"/><text id="T" x="1" font-size="16" text-anchor="middle">A &amp; B &lt; C &#x4e2d;<![CDATA[ <raw>]]></text></g></svg>');
  assert.deepEqual(result.warnings, ['warning: assigned id rect2 to unnamed <rect>']);
  const xml = codec.encode(result.document);
  assert.match(xml, /A &amp; B &lt; C 中 &lt;raw&gt;/);
  assert.equal(codec.encode(codec.decode(xml).document), xml);
  assert.equal(result.document.find('T').parent?.id, 'G');
});

test('SVG rejects duplicate ids, malformed XML and unsupported semantics atomically', () => {
  const codec = new SvgCodec();
  for (const xml of [
    '<svg><rect id="x"/><g id="x"/></svg>', '<svg><g></svg>',
    '<!DOCTYPE svg [<!ENTITY a SYSTEM "file:///etc/passwd">]><svg/>',
    '<svg><script>alert(1)</script></svg>', '<svg><g transform="rotate(30)"/></svg>',
    '<svg width="800" height="600" viewBox="0 0 400 300"/>',
    '<svg><text onclick="x">a</text></svg>', '<svg><text>&evil;</text></svg>',
    '<svg><rect fill="url(https://example.com/remote.svg#paint)"/></svg>',
  ]) assert.throws(() => codec.decode(xml));
});

test('nested translate/uniform scale flatten using SVG matrix order and inherited text/stroke sizes', () => {
  const codec = new SvgCodec();
  const { document } = codec.decode('<svg width="400" height="200"><g id="diagram" transform="translate(60,40)"><rect id="a" x="0" y="0" width="120" height="60"/><g id="nodeB" transform="translate(200,0) scale(0.8)" stroke-width="2"><rect id="r" x="0" y="0" width="120" height="60"/><text id="t" x="60" y="38" font-size="16" text-anchor="middle">End</text></g></g></svg>');
  assert.equal(document.find('r').attributes().get('x'), '260');
  assert.equal(document.find('r').attributes().get('y'), '40');
  assert.equal(document.find('r').attributes().get('width'), '96');
  assert.equal(document.find('r').attributes().get('stroke-width'), '1.6');
  assert.equal(document.find('t').attributes().get('x'), '308');
  assert.equal(document.find('t').attributes().get('y'), '70.4');
  assert.equal(document.find('t').attributes().get('font-size'), '12.8');
  assert.doesNotMatch(document.xml(), /transform=/);
  assert.equal(codec.decode(document.xml()).document.xml(), document.xml());
  const scaled = codec.decode('<svg><g transform="scale(2) translate(3 4)"><circle id="c" cx="1" cy="2" r="3"/></g></svg>').document.find('c').attributes();
  assert.equal(scaled.get('cx'), '8'); assert.equal(scaled.get('cy'), '12'); assert.equal(scaled.get('r'), '6');
  for (const transform of ['scale(0)', 'scale(-1)', 'scale(1,2)', 'matrix(1 0 0 1 0 0)', 'translate(1) junk', 'translate(1),']) assert.throws(() => codec.decode(`<svg><g transform="${transform}"/></svg>`));
});

test('atomic file replacement leaves existing target intact on rename failure and removes temporary bytes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-file-'));
  try {
    const port = new NodeFilePort(); const target = join(directory, 'saved.svg');
    port.write(target, 'old'); port.write(target, 'new'); assert.equal(readFileSync(target, 'utf8'), 'new');
    const occupied = join(directory, 'occupied.svg'); mkdirSync(occupied);
    assert.throws(() => port.write(occupied, 'replacement'));
    assert.deepEqual(readdirSync(directory).sort(), ['occupied.svg', 'saved.svg']);
    assert.equal(readFileSync(target, 'utf8'), 'new');
    assert.throws(() => port.write(join(directory, 'missing', 'file.svg'), 'x'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('successful IO barriers and failed read/write leave document, history and path intact', () => {
  const storage = new Map<string, string>(); let fail = false;
  const editor = new Editor({ read: path => { if (!storage.has(path)) throw new Error('missing'); return storage.get(path)!; }, write: (path, content) => { if (fail) throw new Error('disk'); storage.set(path, content); } });
  editor.init(); editor.execute(new CreateCommand(['g', 'a']));
  const before = editor.document().xml();
  assert.throws(() => editor.read('missing.svg'), /cannot read file: missing.svg/);
  fail = true; assert.throws(() => editor.save('bad.svg'), /cannot write file: bad.svg/);
  assert.equal(editor.document().xml(), before); editor.undo(); editor.redo();
  fail = false; editor.save('good.svg'); assert.throws(() => editor.undo(), /io command/);
  editor.execute(new CreateCommand(['g', 'b'])); editor.canvas(); editor.undo();
  assert.equal(editor.document().xml(), before);
  storage.set('malformed.svg', '<svg>'); assert.throws(() => editor.read('malformed.svg'));
  editor.save(); assert.equal(storage.get('good.svg'), before);
  editor.read('good.svg'); assert.throws(() => editor.redo(), /io command/);
  editor.execute(new CreateCommand(['g', 'b'])); editor.canvas(123, 456);
  assert.throws(() => editor.undo(), /io command/);
});
