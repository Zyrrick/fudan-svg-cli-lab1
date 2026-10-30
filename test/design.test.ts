import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReceiverProbe } from './ReceiverProbe.js';
import { CreateCommand } from '../src/commands/CreateCommand.js';
import { DeleteCommand } from '../src/commands/DeleteCommand.js';
import { MoveCommand } from '../src/commands/MoveCommand.js';
import { ScaleCommand } from '../src/commands/ScaleCommand.js';
import { SetCommand } from '../src/commands/SetCommand.js';
import { GroupCommand } from '../src/commands/GroupCommand.js';
import { UngroupCommand } from '../src/commands/UngroupCommand.js';
import { AddToCommand } from '../src/commands/AddToCommand.js';
import { OrderCommand } from '../src/commands/OrderCommand.js';
import { Document } from '../src/model/Document.js';
import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { SvgCodec } from '../src/io/SvgCodec.js';
import { Presenter } from '../src/cli/Presenter.js';
import { TestShapeFactory } from './TestShapeFactory.js';
import { History } from '../src/application/History.js';

test('all concrete commands delegate one request to a substitute receiver and use its change', () => {
  const receiver = new ReceiverProbe();
  const cases = [
    [new CreateCommand(receiver, ['rect', 'r', '1', '2', '3', '4', 'in', 'g']), 'create', ['rect', 'r', ['1', '2', '3', '4'], 'g']],
    [new DeleteCommand(receiver, ['r']), 'delete', ['r']],
    [new MoveCommand(receiver, ['r', '.2', '-.3']), 'move', ['r', .2, -.3]],
    [new ScaleCommand(receiver, ['r', '2']), 'scale', ['r', 2]],
    [new SetCommand(receiver, ['r', 'fill', 'red']), 'set', ['r', 'fill', 'red']],
    [new GroupCommand(receiver, ['g', 'r', 'c']), 'group', ['g', ['r', 'c']]],
    [new UngroupCommand(receiver, ['g']), 'ungroup', ['g']],
    [new AddToCommand(receiver, ['g', 'r']), 'addto', ['g', 'r']],
    [new OrderCommand(receiver, ['r'], true), 'reorder', ['r', true]],
  ] as const;
  for (const [command, operation, args] of cases) {
    const before = receiver.calls().length;
    assert.equal(command.execute(), 'receiver result');
    assert.deepEqual(receiver.calls().slice(before), [{ operation, args }]);
    command.undo(); command.redo();
    assert.deepEqual(receiver.calls().slice(before + 1), [{ operation: 'undo', args: [] }, { operation: 'redo', args: [] }]);
  }
});

test('command lifecycle advances only after a successful receiver or change operation', () => {
  const receiver = new ReceiverProbe(); const command = new MoveCommand(receiver, ['r', '1', '0']);
  assert.throws(() => command.undo(), /not ready/); assert.throws(() => command.redo(), /not ready/);
  receiver.failure = 'execute'; assert.throws(() => command.execute(), /receiver failed/);
  receiver.failure = ''; command.execute(); assert.throws(() => command.execute(), /already executed/);
  receiver.failure = 'undo'; assert.throws(() => command.undo(), /undo failed/);
  receiver.failure = ''; command.undo(); assert.throws(() => command.undo(), /not ready/);
  receiver.failure = 'redo'; assert.throws(() => command.redo(), /redo failed/);
  receiver.failure = ''; command.redo();
});

test('alternate container and text classes import, transform and traverse through contracts', () => {
  const codec = new SvgCodec(new TestShapeFactory());
  const { document } = codec.decode('<svg><g id="outer" transform="translate(10,20) scale(2)"><g id="inner" transform="translate(3,4)"><text id="label" x="1" y="2" font-size="7">label</text><rect id="r" width="4" height="5"/></g></g></svg>');
  assert.equal(document.container('inner').component, document.find('inner'));
  assert.equal(document.find('label').parent, document.container('inner'));
  assert.equal(document.find('label').attributes().get('x'), '18');
  assert.equal(document.find('label').attributes().get('y'), '32');
  assert.equal(document.find('label').attributes().get('font-size'), '14');
  assert.match(new Presenter().tree(document), /text#label/);
  const before = document.xml(); const change = document.move('inner', .1, .2); change.undo();
  assert.equal(document.xml(), before); assert.equal(codec.decode(before).document.xml(), before);
});

test('local structural edits retain original objects and restore cross-parent sibling positions', () => {
  const document = new Document(); const factory = new ShapeFactory();
  for (const id of ['left', 'right']) document.add(factory.create('g', id, []));
  for (const [id, parent] of [['a', 'left'], ['b', 'left'], ['c', 'right'], ['d', 'right']] as const) document.add(factory.create('rect', id, ['1', '2', '3', '4']), parent);
  const refs = document.all(); const original = document.xml();
  const grouped = document.group('grouped', ['d', 'b']); const after = document.xml();
  grouped.undo(); assert.equal(document.xml(), original); assert.deepEqual(document.all(), refs);
  grouped.redo(); assert.equal(document.xml(), after);
  const moved = document.addto('left', 'grouped'); const nested = document.xml();
  const ungrouped = document.ungroup('grouped'); ungrouped.undo(); assert.equal(document.xml(), nested);
  ungrouped.redo(); ungrouped.undo(); moved.undo(); grouped.undo(); assert.equal(document.xml(), original);
  const deletedObject = document.find('left'); const deleted = document.delete('left'); deleted.undo();
  assert.equal(document.find('left'), deletedObject); assert.equal(document.xml(), original);
});

test('geometry and property records restore exact floats, original absence and unaffected identity', () => {
  const document = new Document(); document.create('g', 'g', []);
  document.create('rect', 'r', ['.1', '.2', '.3', '.4'], 'g');
  document.create('text', 't', ['.1', '.2', 'original'], 'g');
  const refs = document.all(); const before = document.xml();
  const moved = document.move('g', .2, .3); const scaled = document.scale('g', 3);
  const styled = document.set('g', 'stroke-width', '2'); const text = document.set('t', 'text', 'changed');
  text.undo(); styled.undo(); scaled.undo(); moved.undo();
  assert.equal(document.xml(), before); assert.deepEqual(document.all(), refs);
  moved.redo(); scaled.redo(); styled.redo(); text.redo();
  assert.equal(document.find('t').details().get('text'), 'changed');
});

test('failed structural undo rolls back its partial placement and remains on the invoker stack', () => {
  const document = new Document(); document.create('g', 'left', []); document.create('g', 'right', []);
  document.create('rect', 'r', ['1', '2', '3', '4'], 'left');
  const original = document.xml(); const object = document.find('r'); const history = new History();
  history.execute(new AddToCommand(document, ['right', 'r'])); const moved = document.xml();
  const parent = document.container('left'); const add = parent.add.bind(parent); let fail = true;
  parent.add = (shape, index) => { if (fail) { fail = false; throw new Error('injected attachment failure'); } add(shape, index); };
  assert.throws(() => history.undo(), /injected attachment failure/);
  assert.equal(document.xml(), moved); assert.equal(document.find('r'), object);
  history.undo(); assert.equal(document.xml(), original); history.redo(); assert.equal(document.xml(), moved);
});

test('direct composite move rolls back an overflow and invalid insertion leaves both sides intact', () => {
  const document = new Document(); document.create('g', 'g', []);
  document.create('rect', 'first', ['.1', '.2', '3', '4'], 'g');
  document.create('circle', 'last', ['1e308', '0', '1'], 'g');
  const before = document.xml();
  assert.throws(() => document.find('g').move(1e308, 0), /finite/); assert.equal(document.xml(), before);
  const detached = new ShapeFactory().create('circle', 'detached', ['0', '0', '1']);
  assert.throws(() => document.container('g').add(detached, -1), /invalid child index/);
  assert.equal(detached.parent, null); assert.equal(document.xml(), before);
  const children = document.container('g').children(); Reflect.apply(Array.prototype.pop, children, []);
  assert.equal(document.container('g').children().length, 2);
});
