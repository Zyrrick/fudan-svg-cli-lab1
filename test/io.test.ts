import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { Editor } from '../src/application/Editor.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';

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
    '<svg><script>alert(1)</script></svg>', '<svg><g transform="translate(60,40)"/></svg>',
    '<svg width="800" height="600" viewBox="0 0 400 300"/>',
    '<svg><text onclick="x">a</text></svg>', '<svg><text>&evil;</text></svg>',
  ]) assert.throws(() => codec.decode(xml));
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
