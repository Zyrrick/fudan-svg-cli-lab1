import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Document } from '../src/model/Document.js';
import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { Group } from '../src/model/Group.js';
import { MoveCommand } from '../src/commands/MoveCommand.js';
import { SetCommand } from '../src/commands/SetCommand.js';
import { Editor } from '../src/application/Editor.js';
import { History } from '../src/application/History.js';
import { MemoryFilePort } from './MemoryFilePort.js';

test('course: command binds its receiver and executes without a document argument', () => {
  const document = new Document(); const factory = new ShapeFactory();
  document.add(factory.create('rect', 'r', ['0.1', '0.2', '3', '4']));
  const before = document.xml(); const command = new MoveCommand(document, ['r', '0.2', '0.3']);
  command.execute(); const after = document.xml();
  command.undo(); assert.equal(document.xml(), before);
  command.redo(); assert.equal(document.xml(), after);
});

test('course: editor rejects a command bound to another or replaced document', () => {
  const editor = new Editor(new MemoryFilePort()); editor.init();
  const old = editor.document(); const command = new MoveCommand(old, ['r', '1', '0']);
  editor.init(); const before = editor.document().xml();
  assert.throws(() => editor.execute(command), /different document/);
  assert.equal(editor.document().xml(), before); assert.equal(old.all().length, 0);
});

test('course: one leaf edit preserves unrelated object identity and never clones the document', () => {
  const document = new Document(); const factory = new ShapeFactory();
  for (const id of ['r', 'unrelated']) document.add(factory.create('rect', id, ['0.1', '0.2', '3', '4']));
  const unrelated = document.find('unrelated'); const before = document.xml();
  Reflect.set(document, 'clone', () => { throw new Error('whole-document cloning is forbidden'); });
  const command = new MoveCommand(document, ['r', '0.2', '0.3']);
  command.execute(); command.undo(); assert.equal(document.xml(), before);
  assert.equal(document.find('unrelated'), unrelated);
  command.redo(); assert.equal(document.find('unrelated'), unrelated);
});

test('course: receiver owns create and returns a reversible edit with exact placement', () => {
  const document = new Document(); const before = document.xml();
  const edit = document.create('rect', 'r', ['1', '2', '3', '4']);
  assert.equal(document.find('r').parent?.children()[0]?.id, 'r');
  edit.undo(); assert.equal(document.xml(), before); edit.redo();
  assert.equal(document.find('r').attributes().get('width'), '3');
});

test('course: receiver itself rolls back a nested geometry failure', () => {
  const document = new Document(); const factory = new ShapeFactory();
  document.add(factory.create('g', 'g', []));
  document.add(factory.create('rect', 'a', ['0.1', '0.2', '3', '4']), 'g');
  document.add(factory.create('circle', 'b', ['1e308', '0', '1']), 'g');
  const before = document.xml();
  assert.throws(() => document.scale('g', 2), /finite/);
  assert.equal(document.xml(), before);
});

test('course: parent linkage cannot be changed through a public setter; add prevents cycles', () => {
  const parent = new Group('parent'); const child = new Group('child'); parent.add(child);
  assert.equal(Reflect.get(child, 'attach'), undefined);
  assert.throws(() => parent.add(parent), /own descendant/);
  assert.throws(() => child.add(parent), /own descendant/);
  assert.equal(child.parent, parent); assert.deepEqual(parent.children(), [child]);
  assert.throws(() => parent.add(child), /detached/);
  parent.remove(child); assert.equal(child.parent, null);
});

test('course: clients use polymorphic capabilities instead of concrete shape instanceof', () => {
  for (const file of ['src/model/Document.ts', 'src/io/SvgElement.ts', 'src/io/SvgTransform.ts', 'src/cli/Presenter.ts']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /instanceof\s+(?:Group|Text|Shape)\b/, file);
  }
  assert.doesNotMatch(readFileSync('src/model/Shape.ts', 'utf8'), /from ['"].*Group\.js['"]/);
});

test('course: property undo restores absence as well as exact text', () => {
  const document = new Document(); const factory = new ShapeFactory();
  document.add(factory.create('text', 't', ['0', '1', 'original'])); const before = document.xml();
  const style = new SetCommand(document, ['t', 'fill', 'red']); style.execute(); style.undo();
  assert.equal(document.xml(), before);
  const text = new SetCommand(document, ['t', 'text', 'changed']); text.execute(); text.undo();
  assert.equal(document.xml(), before);
});

test('course: invoker calls a mock command without receiver arguments and preserves failed stacks', () => {
  const history = new History(); const calls: string[] = []; let fail = '';
  const mock = {
    execute: (...args: unknown[]) => { calls.push(`execute:${args.length}`); if (fail === 'execute') throw new Error('execute failed'); return 'done'; },
    undo: (...args: unknown[]) => { calls.push(`undo:${args.length}`); if (fail === 'undo') throw new Error('undo failed'); return 'undone'; },
    redo: (...args: unknown[]) => { calls.push(`redo:${args.length}`); if (fail === 'redo') throw new Error('redo failed'); return 'redone'; },
  };
  history.execute(mock); fail = 'undo'; assert.throws(() => history.undo(), /undo failed/);
  fail = ''; history.undo(); fail = 'redo'; assert.throws(() => history.redo(), /redo failed/);
  fail = 'execute'; assert.throws(() => history.execute(mock), /execute failed/);
  fail = ''; history.redo();
  assert.deepEqual(calls, ['execute:0', 'undo:0', 'undo:0', 'redo:0', 'execute:0', 'redo:0']);
  history.barrier(); assert.throws(() => history.undo(), /io command/);
});
