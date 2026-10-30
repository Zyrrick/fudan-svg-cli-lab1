import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Document } from '../src/model/Document.js';
import { History } from '../src/application/History.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { MoveCommand } from '../src/commands/MoveCommand.js';
import { ScaleCommand } from '../src/commands/ScaleCommand.js';
import { DeleteCommand } from '../src/commands/DeleteCommand.js';
import { GroupCommand } from '../src/commands/GroupCommand.js';

test('each command is one exact local edit, failed edits preserve document and redo', () => {
  const doc = new Document(); const history = new History();
  assert.throws(() => history.undo(), /undo not allowed after io command/);
  history.execute(new CreateCommand(doc, ['rect', 'r', '1', '2', '3', '4']));
  history.execute(new CreateCommand(doc, ['circle', 'c', '1e308', '0', '1']));
  history.execute(new GroupCommand(doc, ['g', 'c', 'r']));
  const before = doc.xml();
  history.execute(new MoveCommand(doc, ['r', '5', '6']));
  const after = doc.xml(); history.undo(); assert.equal(doc.xml(), before);
  assert.throws(() => history.execute(new ScaleCommand(doc, ['g', '2'])), /finite/);
  assert.equal(doc.xml(), before);
  history.redo(); assert.equal(doc.xml(), after);
  history.execute(new DeleteCommand(doc, ['g'])); assert.equal(doc.all().length, 0);
  history.undo(); assert.equal(doc.xml(), after);
  history.undo(); history.execute(new MoveCommand(doc, ['r', '0', '0']));
  assert.throws(() => history.redo(), /nothing to redo/);
  history.barrier(); assert.throws(() => history.redo(), /io command/);
});
