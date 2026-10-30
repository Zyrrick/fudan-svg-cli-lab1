import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class ScaleCommand extends Command {
  private readonly id: string;
  private readonly factor: number;
  constructor(receiver: EditingReceiver, args: readonly string[]) { super(receiver); Validation.arity(args, 2); this.id = args[0]!; this.factor = Validation.number(args[1]!); }
  protected override apply() { return this.receiver.scale(this.id, this.factor); }
}
