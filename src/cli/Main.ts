import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { Editor } from '../application/Editor.js';
import { NodeFilePort } from '../io/NodeFilePort.js';
import { Controller } from './Controller.js';

export class Main {
  static run(): void {
    const controller = new Controller(new Editor(new NodeFilePort()));
    const input = createInterface({ input: stdin, output: stdout, terminal: Boolean(stdin.isTTY && stdout.isTTY) });
    stdout.write("svg-editor 0.1 — type 'help' for commands\n\n");
    input.setPrompt('svg> '); input.prompt();
    input.on('line', line => { const result = controller.run(line); if (result) stdout.write(`${result}\n`); input.prompt(); });
    input.on('close', () => { stdout.write('\n'); });
  }
}
Main.run();
