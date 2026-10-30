import { Editor } from '../application/Editor.js';
import type { Command } from '../commands/Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { CreateCommand } from '../commands/CreateCommand.js';
import { DeleteCommand } from '../commands/DeleteCommand.js';
import { MoveCommand } from '../commands/MoveCommand.js';
import { ScaleCommand } from '../commands/ScaleCommand.js';
import { SetCommand } from '../commands/SetCommand.js';
import { GroupCommand } from '../commands/GroupCommand.js';
import { UngroupCommand } from '../commands/UngroupCommand.js';
import { AddToCommand } from '../commands/AddToCommand.js';
import { OrderCommand } from '../commands/OrderCommand.js';
import { Validation } from '../model/Validation.js';
import { Tokenizer } from './Tokenizer.js';
import { Presenter } from './Presenter.js';

export class Controller {
  private readonly tokenizer = new Tokenizer();
  private readonly presenter = new Presenter();
  private readonly handlers: ReadonlyMap<string, (args: readonly string[]) => string>;
  constructor(private readonly editor: Editor) {
    // Name dispatch 2/2: all CLI command lookup stays in this one table.
    this.handlers = new Map([
      ['init', args => { Validation.arity(args, 0, 2); return editor.init(args[0] === undefined ? 800 : Validation.number(args[0]), args[1] === undefined ? 600 : Validation.number(args[1])); }],
      ['read', args => { Validation.arity(args, 1); return editor.read(args[0]!); }],
      ['save', args => { Validation.arity(args, 0, 1); return editor.save(args[0]); }],
      ['canvas', args => { Validation.arity(args, 0, 2); return editor.canvas(args[0] === undefined ? undefined : Validation.number(args[0]), args[1] === undefined ? undefined : Validation.number(args[1])); }],
      ['create', args => this.edit(args, (receiver, values) => new CreateCommand(receiver, values))],
      ['delete', args => this.edit(args, (receiver, values) => new DeleteCommand(receiver, values))],
      ['move', args => this.edit(args, (receiver, values) => new MoveCommand(receiver, values))],
      ['scale', args => this.edit(args, (receiver, values) => new ScaleCommand(receiver, values))],
      ['set', args => this.edit(args, (receiver, values) => new SetCommand(receiver, values))],
      ['group', args => this.edit(args, (receiver, values) => new GroupCommand(receiver, values))],
      ['ungroup', args => this.edit(args, (receiver, values) => new UngroupCommand(receiver, values))],
      ['addto', args => this.edit(args, (receiver, values) => new AddToCommand(receiver, values))],
      ['front', args => this.edit(args, (receiver, values) => new OrderCommand(receiver, values, true))],
      ['back', args => this.edit(args, (receiver, values) => new OrderCommand(receiver, values, false))],
      ['undo', args => { Validation.arity(args, 0); return editor.undo(); }],
      ['redo', args => { Validation.arity(args, 0); return editor.redo(); }],
      ['tree', args => { Validation.arity(args, 0, 1); return this.presenter.tree(editor.document(), args[0]); }],
      ['show', args => { Validation.arity(args, 1); return this.presenter.show(editor.document(), args[0]!); }],
      ['help', args => { Validation.arity(args, 0); return this.presenter.help(); }],
    ]);
  }
  private edit(args: readonly string[], create: (receiver: EditingReceiver, args: readonly string[]) => Command): string {
    const receiver = this.editor.document(); return this.editor.execute(create(receiver, args));
  }
  run(line: string): string {
    try {
      const [name, ...args] = this.tokenizer.tokenize(line); if (name === undefined) return '';
      const handler = this.handlers.get(name); if (!handler) throw new Error(`unknown command: ${name}`);
      return handler(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unexpected failure';
      return `error: ${message.replace(/[\r\n\u2028\u2029]+/g, ' ')}`;
    }
  }
}
