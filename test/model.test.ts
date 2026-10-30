import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Document } from '../src/model/Document.js';
import { ShapeFactory } from '../src/model/ShapeFactory.js';

test('all six polymorphic shapes, decimal geometry, defaults and escaping', () => {
  const factory = new ShapeFactory(); const doc = new Document();
  doc.add(factory.create('g', 'scene', []));
  for (const [type, args] of [
    ['rect', ['1.5', '-2', '3', '4']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']], ['line', ['1', '2', '3', '4']],
    ['text', ['1', '2', 'A < B & "C"']],
  ] as const) doc.add(factory.create(type, type, args), 'scene');
  doc.move('scene', 2, 3); doc.scale('scene', 2);
  assert.equal(doc.find('rect').attributes().get('x'), '7');
  assert.equal(doc.find('circle').attributes().get('r'), '6');
  assert.equal(doc.find('line').attributes().get('x2'), '10');
  assert.match(doc.xml(), /A &lt; B &amp; &quot;C&quot;/);
  assert.doesNotMatch(doc.xml(), /fill=/);
  assert.equal(doc.all().length, 6);
});

test('group order is document preorder, ancestors cannot be grouped together', () => {
  const factory = new ShapeFactory(); const doc = new Document();
  for (const id of ['a', 'b', 'c']) doc.add(factory.create('circle', id, ['0', '0', '1']));
  doc.group('g', ['c', 'a']);
  assert.deepEqual(doc.find('g').children().map(shape => shape.id), ['a', 'c']);
  assert.throws(() => doc.group('bad', ['a', 'g']), /cannot group a container into its own descendant: g/);
  assert.throws(() => doc.addto('g', 'g'), /own descendant/);
  assert.throws(() => doc.ungroup('g'), /top-level/);
  assert.throws(() => factory.create('box', 'box', []), /unknown shape type: box/);
  assert.throws(() => doc.set('a', 'href', 'x'), /unknown attribute: href/);
  assert.throws(() => doc.set('a', 'r', '-1'), /nonnegative/);
});
