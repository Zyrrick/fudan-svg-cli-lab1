import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class OrderCommand extends Command {
  private readonly id: string;
  constructor(receiver: EditingReceiver, args: readonly string[], private readonly front: boolean) { super(receiver); Validation.arity(args, 1); this.id = args[0]!; }
  protected override apply() { return this.receiver.reorder(this.id, this.front); }
}
