import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/application/Editor.js';
import { Controller } from '../src/cli/Controller.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { MemoryFilePort } from './MemoryFilePort.js';

test('read then save copy then edit then bare save writes original read path', () => {
  const files = new MemoryFilePort(); files.write('original.svg', '<svg><g id="original"/></svg>');
  const editor = new Editor(files); const cli = new Controller(editor);
  assert.equal(cli.run('read original.svg'), 'read original.svg (1 elements)');
  assert.equal(cli.run('save copy.svg'), 'saved to copy.svg (1 elements)');
  for (const action of ['undo', 'redo']) assert.equal(cli.run(action), 'error: undo not allowed after io command');
  assert.equal(cli.run('create g added'), 'g#added created');
  assert.equal(cli.run('save'), 'saved to original.svg (2 elements)');
  assert.match(files.read('original.svg'), /id="added"/);
  assert.doesNotMatch(files.read('copy.svg'), /id="added"/);
  for (const action of ['undo', 'redo']) assert.equal(cli.run(action), 'error: undo not allowed after io command');
});

test('failed explicit and default saves preserve original source, document and redo branch', () => {
  const storage = new Map([['source.svg', '<svg><g id="original"/></svg>']]);
  const blocked = new Set<string>();
  const editor = new Editor({
    read: path => { const content = storage.get(path); if (content === undefined) throw new Error('missing'); return content; },
    write: (path, content) => { if (blocked.has(path)) throw new Error('blocked'); storage.set(path, content); },
  });
  editor.read('source.svg'); editor.save('copy.svg');
  editor.execute(new CreateCommand(editor.document(), ['g', 'added'])); const edited = editor.document().xml();
  editor.undo(); const before = editor.document().xml();
  blocked.add('failed-copy.svg');
  assert.throws(() => editor.save('failed-copy.svg'), /cannot write file: failed-copy.svg/);
  assert.equal(editor.document().xml(), before); assert.equal(storage.has('failed-copy.svg'), false);
  editor.redo(); assert.equal(editor.document().xml(), edited); editor.undo();
  blocked.add('source.svg');
  assert.throws(() => editor.save(), /cannot write file: source.svg/);
  assert.equal(editor.document().xml(), before);
  editor.redo(); assert.equal(editor.document().xml(), edited);
  assert.throws(() => editor.read('missing.svg'), /cannot read file: missing.svg/);
  blocked.delete('source.svg'); assert.equal(editor.save(), 'saved to source.svg (2 elements)');
  assert.match(storage.get('source.svg')!, /id="added"/); assert.doesNotMatch(storage.get('copy.svg')!, /id="added"/);
  assert.throws(() => editor.undo(), /io command/); assert.throws(() => editor.redo(), /io command/);
});

test('init clears read source and save-as never creates a default path for a new document', () => {
  const files = new MemoryFilePort(); files.write('source.svg', '<svg><g id="original"/></svg>');
  const editor = new Editor(files); editor.read('source.svg');
  assert.throws(() => editor.init(0, 600), /positive/);
  assert.equal(editor.save(), 'saved to source.svg (1 elements)');
  const source = files.read('source.svg');
  editor.init(); editor.execute(new CreateCommand(editor.document(), ['g', 'after-init']));
  editor.undo(); const empty = editor.document().xml();
  assert.throws(() => editor.save(), /no save path/);
  assert.equal(editor.document().xml(), empty); assert.equal(files.read('source.svg'), source);
  editor.redo(); assert.equal(editor.document().all().length, 1);
  editor.save('new.svg'); const afterSave = editor.document().xml();
  assert.throws(() => editor.save(), /no save path/);
  assert.equal(editor.document().xml(), afterSave);
  assert.throws(() => editor.undo(), /io command/); assert.throws(() => editor.redo(), /io command/);
  editor.read('new.svg'); editor.execute(new CreateCommand(editor.document(), ['g', 'second']));
  assert.equal(editor.save(), 'saved to new.svg (2 elements)');
  assert.equal(files.read('source.svg'), source);
});
