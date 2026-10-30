import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { Editor } from '../src/application/Editor.js';
import { Controller } from '../src/cli/Controller.js';
import { MemoryFilePort } from './MemoryFilePort.js';

test('every geometry setter, style setter and clone retain concrete shape semantics', () => {
  const factory = new ShapeFactory();
  for (const [type, args, geometry] of [
    ['rect', ['1', '2', '3', '4'], ['x', 'y', 'width', 'height']],
    ['circle', ['1', '2', '3'], ['cx', 'cy', 'r']],
    ['ellipse', ['1', '2', '3', '4'], ['cx', 'cy', 'rx', 'ry']],
    ['line', ['1', '2', '3', '4'], ['x1', 'y1', 'x2', 'y2']],
    ['text', ['1', '2', 'hello'], ['x', 'y']], ['g', [], []],
  ] as const) {
    const shape = factory.create(type, type, args);
    for (const attribute of geometry) { shape.set(attribute, '12.5'); assert.equal(shape.attributes().get(attribute), '12.5'); }
    for (const [key, value] of [['fill', 'red'], ['stroke', '#abc'], ['stroke-width', '1.25']] as const) shape.set(key, value);
    if (type === 'text') shape.set('text', 'A\nB\t<>&"\'中');
    assert.equal(shape.clone().xml(), shape.xml());
    assert.throws(() => shape.set('font-size', '20'), /unknown attribute/);
    assert.throws(() => shape.set('id', 'other'), /unknown attribute/);
    const codec = new SvgCodec(); const xml = `<svg>${shape.xml()}</svg>`;
    assert.equal(codec.decode(xml).document.children()[0]!.xml(), shape.xml());
  }
});

test('provided typical transcript produces documented states and exactly two expected errors', () => {
  const files = new MemoryFilePort(); files.write('examples/other.svg', readFileSync('examples/other.svg', 'utf8'));
  const editor = new Editor(files); const controller = new Controller(editor);
  const results = readFileSync('scripts/typical.cli', 'utf8').split(/\r?\n/).map(line => controller.run(line));
  assert.deepEqual(results.filter(result => result.startsWith('error:')), ['error: cannot group a container into its own descendant: markers', 'error: undo not allowed after io command']);
  assert.ok(results.some(result => result === 'saved to examples/demo.svg (5 elements)'));
  assert.ok(results.some(result => result.startsWith('warning: assigned id rect1 to unnamed <rect>')));
  const saved = new SvgCodec().decode(files.read('examples/demo.svg')).document;
  assert.equal(saved.find('c1').attributes().get('cx'), '130');
  assert.equal(saved.find('title').details().get('text'), 'My Diagram');
  assert.equal(saved.find('box').parent?.id, 'markers');
  assert.equal(editor.document().all().length, 7);
  assert.equal(editor.document().width, 400); assert.equal(editor.document().height, 300);
});

test('provided flowchart transcript and transform example roundtrip without errors', () => {
  const files = new MemoryFilePort(); const editor = new Editor(files); const controller = new Controller(editor);
  for (const line of readFileSync('scripts/flowchart.cli', 'utf8').split(/\r?\n/)) assert.doesNotMatch(controller.run(line), /^error:/, line);
  const xml = files.read('examples/flowchart.svg'); assert.equal(editor.document().all().length, 8);
  assert.equal(editor.document().find('process').attributes().get('y'), '100');
  assert.equal(editor.document().find('process-label').details().get('text'), '处理数据 v2');
  assert.equal(xml, readFileSync('examples/flowchart.svg', 'utf8'));
  const codec = new SvgCodec(); const imported = codec.decode(readFileSync('examples/transformed.svg', 'utf8'));
  assert.equal(imported.warnings.length, 2);
  assert.equal(imported.document.xml(), readFileSync('examples/transformed-flat.svg', 'utf8'));
  assert.equal(codec.decode(imported.document.xml()).document.xml(), imported.document.xml());
});

test('source architecture obeys dependency directions and one class per matching filename', () => {
  const permitted: Readonly<Record<string, readonly string[]>> = { model: ['model'], commands: ['commands', 'model'], io: ['io', 'model'], application: ['application', 'commands', 'model', 'io'], cli: ['cli', 'application', 'commands', 'io', 'model'] };
  for (const file of readdirSync('src', { recursive: true }).map(String).filter(file => file.endsWith('.ts'))) {
    const source = readFileSync(resolve('src', file), 'utf8'); const module = file.split('/')[0]!;
    const names = Array.from(source.matchAll(/export (?:abstract )?class (\w+)/g), match => match[1]!);
    if (names.length) assert.deepEqual(names, [basename(file, '.ts')], file);
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
      if (!match[1]!.startsWith('.')) { assert.ok(module === 'io' || module === 'cli', `${file}: external dependency ${match[1]}`); continue; }
      const dependency = resolve('src', dirname(file), match[1]!).split('/src/')[1]!.split('/')[0]!;
      assert.ok(permitted[module]!.includes(dependency), `${file} -> ${dependency}`);
    }
    assert.doesNotMatch(source, /\bswitch\s*\(/, file);
  }
});
