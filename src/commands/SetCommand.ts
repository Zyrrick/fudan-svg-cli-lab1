import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class SetCommand extends Command {
  private readonly id: string;
  private readonly attribute: string;
  private readonly value: string;
  constructor(receiver: EditingReceiver, args: readonly string[]) { super(receiver); Validation.arity(args, 3); [this.id, this.attribute, this.value] = args as [string, string, string]; }
  protected override apply() { return this.receiver.set(this.id, this.attribute, this.value); }
}
