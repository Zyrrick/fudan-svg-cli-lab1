import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class AddToCommand extends Command {
  private readonly groupId: string;
  private readonly id: string;
  constructor(receiver: EditingReceiver, args: readonly string[]) { super(receiver); Validation.arity(args, 2); [this.groupId, this.id] = args as [string, string]; }
  protected override apply() { return this.receiver.addto(this.groupId, this.id); }
}
