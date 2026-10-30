import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class UngroupCommand extends Command {
  private readonly id: string;
  constructor(receiver: EditingReceiver, args: readonly string[]) { super(receiver); Validation.arity(args, 1); this.id = args[0]!; }
  protected override apply() { return this.receiver.ungroup(this.id); }
}
