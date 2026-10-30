import { performance } from 'node:perf_hooks';
import { Document } from '../src/model/Document.ts';
import { Shape } from '../src/model/Shape.ts';
import { ShapeFactory } from '../src/model/ShapeFactory.ts';
import { History } from '../src/application/History.ts';
import { MoveCommand } from '../src/commands/MoveCommand.ts';

if (!globalThis.gc) throw new Error('Run with node --expose-gc --import tsx scripts/benchmark.mjs');
let clones = 0;
let captures = 0;
const clone = Shape.prototype.clone;
const geometryValues = Shape.prototype.geometryValues;
Shape.prototype.clone = function () { clones++; return clone.call(this); };
Shape.prototype.geometryValues = function () { captures++; return geometryValues.call(this); };
function scenario(n, h) {
  const document = new Document(); const factory = new ShapeFactory(); const history = new History();
  for (let i = 0; i < n; i++) document.add(factory.create('rect', `r${i}`, ['1', '2', '3', '4']));
  globalThis.gc(); const baseline = process.memoryUsage().heapUsed; clones = 0; captures = 0;
  const started = performance.now();
  for (let i = 0; i < h; i++) history.execute(new MoveCommand(document, ['r0', '1', '0']));
  const msPerEdit = (performance.now() - started) / h;
  globalThis.gc(); const retainedHeapMiB = (process.memoryUsage().heapUsed - baseline) / 1048576;
  const editClones = clones; const geometryCaptures = captures;
  clones = 0; history.undo(); const undoClones = clones;
  clones = 0; history.redo(); const redoClones = clones;
  return { n, h, editClones, geometryCaptures, retainedHeapMiB: +retainedHeapMiB.toFixed(3), msPerEdit: +msPerEdit.toFixed(3), undoClones, redoClones, finalX: document.find('r0').attributes().get('x') };
}
try {
  scenario(10, 5); globalThis.gc();
  const results = [[100, 10], [100, 50], [1000, 10], [1000, 50]].map(([n, h]) => { globalThis.gc(); return scenario(n, h); });
  console.log(JSON.stringify({ node: process.version, platform: process.platform, kind: 'indicative single-process measurement, forced GC, history retained', results }, null, 2));
} finally { Shape.prototype.clone = clone; Shape.prototype.geometryValues = geometryValues; }
