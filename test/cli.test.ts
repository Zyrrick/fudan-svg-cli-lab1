import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Controller } from '../src/cli/Controller.js';
import { Tokenizer } from '../src/cli/Tokenizer.js';
import { Editor } from '../src/application/Editor.js';
import { MemoryFilePort } from './MemoryFilePort.js';

test('tokenizer supports complete comments, colors, decimals, Unicode and quoted escapes', () => {
  const tokenizer = new Tokenizer();
  assert.deepEqual(tokenizer.tokenize('  # full comment'), []);
  assert.deepEqual(tokenizer.tokenize('create text t .5 -2 "中文 \\"quoted\\" \\\\"'), ['create', 'text', 't', '.5', '-2', '中文 "quoted" \\']);
  assert.deepEqual(tokenizer.tokenize('set r fill #ffffff'), ['set', 'r', 'fill', '#ffffff']);
  assert.deepEqual(tokenizer.tokenize('set t text ""'), ['set', 't', 'text', '']);
  for (const input of ['"unterminated', 'a"b"', '"a"b', '"bad\\n"']) assert.throws(() => tokenizer.tokenize(input));
});

test('all commands, sibling paint order, nested ungroup and exact multi-step history', () => {
  const editor = new Editor(new MemoryFilePort()); const cli = new Controller(editor);
  const run = (line: string): string => { const result = cli.run(line); assert.doesNotMatch(result, /^error:/, line); return result; };
  assert.equal(cli.run('tree'), "error: no document. use 'init' or 'read' first");
  assert.match(run('help'), /create ellipse/);
  run('init'); assert.equal(editor.document().width, 800); assert.equal(editor.document().height, 600);
  run('create g scene'); run('create g nested in scene');
  run('create rect r 1.5 2 3 4 red in nested');
  run('create circle c 4 5 6 in nested'); run('create ellipse e 1 2 3 4 in scene');
  run('create line l 1 2 3 4 black in scene'); run('create text t 1 2 "hello world" in scene');
  run('set scene fill blue'); run('set r stroke black'); run('set r stroke-width 2.5');
  run('set r width 9'); run('set c r 7'); run('set e rx 5'); run('set l x2 8'); run('set t text "new text"');
  assert.match(run('show t'), /parent=g#scene/); assert.match(run('show t'), /text="new text"/);
  assert.match(run('tree'), /│ {3}├── rect#r/); assert.match(run('tree nested'), /^g#nested\n├── rect#r/);
  const original = editor.document().xml();
  run('move scene 10 -2'); run('scale scene 2');
  assert.equal(editor.document().find('r').attributes().get('x'), '23');
  assert.equal(editor.document().find('r').attributes().get('height'), '8');
  assert.equal(editor.document().find('l').attributes().get('x2'), '36');
  assert.equal(editor.document().find('t').attributes().get('y'), '0');
  run('undo'); run('undo'); assert.equal(editor.document().xml(), original);
  run('redo'); run('redo'); run('undo'); run('undo');
  run('front r'); assert.deepEqual(editor.document().find('nested').children().map(s => s.id), ['c', 'r']);
  run('back r'); assert.deepEqual(editor.document().find('nested').children().map(s => s.id), ['r', 'c']);
  const beforeUngroup = editor.document().xml();
  run('ungroup nested'); assert.deepEqual(editor.document().find('scene').children().map(s => s.id), ['r', 'c', 'e', 'l', 't']);
  run('undo'); assert.equal(editor.document().xml(), beforeUngroup); run('redo');
  run('group cluster t r'); assert.deepEqual(editor.document().find('cluster').children().map(s => s.id), ['r', 't']);
  run('addto scene cluster'); assert.equal(editor.document().find('scene').children().at(-1)?.id, 'cluster');
  const beforeDelete = editor.document().xml(); run('delete scene'); assert.equal(editor.document().all().length, 0);
  run('undo'); assert.equal(editor.document().xml(), beforeDelete);
  run('tree'); run('show r'); run('help'); run('redo'); assert.equal(editor.document().all().length, 0);
  run('undo'); run('create g Case'); run('create g case');
  assert.equal(cli.run('redo'), 'error: nothing to redo');
});

test('every failed command preserves complete XML and an existing redo branch', () => {
  const files = new MemoryFilePort(); const editor = new Editor(files); const cli = new Controller(editor);
  for (const line of ['init', 'create g outer', 'create g nested in outer', 'create rect r 1 2 3 4 in nested', 'create text t 1 2 "text"', 'move r 1 0']) assert.doesNotMatch(cli.run(line), /^error:/);
  const moved = editor.document().xml(); cli.run('undo'); const baseline = editor.document().xml();
  files.write('invalid.svg', '<svg><rect/><rect id="same"/><g id="same"/></svg>');
  const failures: readonly [string, string | RegExp][] = [
    ['create rect r 0 0 1 1', 'id already exists: r'],
    ['move missing 1 1', 'no such shape: missing'],
    ['create rect new 0 0 1 1 in missing', 'no such container: missing'],
    ['create rect new 0 0 1 1 in r', 'not a container: r'],
    ['create hexagon h', 'unknown shape type: hexagon (is the plugin loaded?)'],
    ['create box b 1 2 3 4 "title"', 'unknown shape type: box (is the plugin loaded?)'],
    ['group bad r nested', 'cannot group a container into its own descendant: nested'],
    ['ungroup outer', 'cannot ungroup top-level container: outer'],
    ['scale r 0', 'scale factor must be positive'], ['scale r -1', 'scale factor must be positive'],
    ['read missing.svg', 'cannot read file: missing.svg'], ['save blocked.svg', 'cannot write file: blocked.svg'],
    ['read invalid.svg', 'id already exists: same'],
    ['set r onclick "evil"', 'unknown attribute: onclick'],
    ['addto nested outer', /own descendant/], ['addto nested nested', /own descendant/],
    ['group bad r r', /duplicate group member/], ['group bad r unknown', /no such shape/],
    ['set r width -1', /nonnegative/], ['set r stroke-width -1', /nonnegative/],
    ['move r NaN 1', /invalid number/], ['scale r Infinity', /invalid number/],
    ['create rect new 1e999 0 1 1', /finite/], ['create g ""', /id must be nonempty/],
    ['init 0 10', /positive/], ['canvas 10 -1', /positive/], ['init 1 2 3', /arguments/],
    ['front missing', /no such shape/], ['delete missing', /no such shape/],
    ['ungroup r', /not a container/], ['show missing', /no such shape/],
    ['tree missing', /no such shape/], ['help extra', /arguments/],
    ['set t text "unclosed', /unterminated/], ['unknown', /unknown command/],
  ];
  for (const [line, expected] of failures) {
    const output = cli.run(line); assert.ok(output.startsWith('error: '), line);
    if (typeof expected === 'string') assert.equal(output, `error: ${expected}`, line); else assert.match(output, expected, line);
    assert.equal(output.split('\n').length, 1, line); assert.equal(editor.document().xml(), baseline, line);
    assert.doesNotMatch(cli.run('redo'), /^error:/, line); assert.equal(editor.document().xml(), moved, line);
    cli.run('undo'); assert.equal(editor.document().xml(), baseline, line);
  }
});

test('each successful document command blocks undo and redo until a new edit', () => {
  for (const barrier of ['init', 'read source.svg', 'save source.svg', 'canvas 900 700']) {
    const files = new MemoryFilePort(); files.write('source.svg', '<svg><g id="source"/></svg>');
    const cli = new Controller(new Editor(files)); cli.run('init'); cli.run('create g old');
    assert.doesNotMatch(cli.run(barrier), /^error:/);
    for (const action of ['undo', 'redo']) assert.equal(cli.run(action), 'error: undo not allowed after io command');
    assert.doesNotMatch(cli.run('create g fresh'), /^error:/); assert.doesNotMatch(cli.run('undo'), /^error:/); assert.doesNotMatch(cli.run('redo'), /^error:/);
  }
});

test('actual CLI process replays Unicode flowchart, saves and reads a real SVG', () => {
  const directory = mkdtempSync(join(tmpdir(), 'svg-cli-e2e-'));
  try {
    const script = `# ignored\ninit 800 600\ncreate g flowchart\ncreate g node1 in flowchart\ncreate rect start 120 100 160 60 #4a90d9 in node1\ncreate text start-label 155 135 "开始" in node1\ncreate g node2 in flowchart\ncreate rect process 520 100 160 60 #f5a623 in node2\ncreate text process-label 545 135 "处理数据" in node2\ncreate line arrow1 280 130 520 130 black in flowchart\nmove node2 0 100\nundo\nset process-label text "处理数据 v2"\nsave "flow chart.svg"\nundo\nread "flow chart.svg"\ntree\n`;
    const process = spawnSync(globalThis.process.execPath, ['--import', resolve('node_modules/tsx/dist/loader.mjs'), resolve('src/cli/Main.ts')], { cwd: directory, input: script, encoding: 'utf8' });
    assert.equal(process.status, 0, process.stderr);
    assert.match(process.stdout, /svg-editor 0.1/); assert.match(process.stdout, /svg> /);
    assert.match(process.stdout, /saved to flow chart.svg \(8 elements\)/);
    assert.match(process.stdout, /error: undo not allowed after io command/);
    assert.match(process.stdout, /text#process-label.*处理数据 v2/);
    assert.match(process.stdout, /line#arrow1/);
    const xml = readFileSync(join(directory, 'flow chart.svg'), 'utf8');
    assert.match(xml, /id="process" x="520" y="100"/);
    assert.match(xml, /处理数据 v2/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
