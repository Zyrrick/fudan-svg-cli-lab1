import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Document } from '../src/model/Document.js';
import { History } from '../src/application/History.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { MoveCommand } from '../src/commands/MoveCommand.js';
import { ScaleCommand } from '../src/commands/ScaleCommand.js';
import { DeleteCommand } from '../src/commands/DeleteCommand.js';
import { GroupCommand } from '../src/commands/GroupCommand.js';

test('each command is one exact snapshot, failed edits preserve document and redo', () => {
  const doc = new Document(); const history = new History();
  assert.throws(() => history.undo(doc), /undo not allowed after io command/);
  history.execute(new CreateCommand(['rect', 'r', '1', '2', '3', '4']), doc);
  history.execute(new CreateCommand(['circle', 'c', '1e308', '0', '1']), doc);
  history.execute(new GroupCommand(['g', 'c', 'r']), doc);
  const before = doc.xml();
  history.execute(new MoveCommand(['r', '5', '6']), doc);
  const after = doc.xml(); history.undo(doc); assert.equal(doc.xml(), before);
  assert.throws(() => history.execute(new ScaleCommand(['g', '2']), doc), /finite/);
  assert.equal(doc.xml(), before);
  history.redo(doc); assert.equal(doc.xml(), after);
  history.execute(new DeleteCommand(['g']), doc); assert.equal(doc.all().length, 0);
  history.undo(doc); assert.equal(doc.xml(), after);
  history.undo(doc); history.execute(new MoveCommand(['r', '0', '0']), doc);
  assert.throws(() => history.redo(doc), /nothing to redo/);
  history.barrier(); assert.throws(() => history.redo(doc), /io command/);
});
