import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class CreateCommand extends Command {
  private readonly args: string[];
  private readonly parentId: string | undefined;
  private readonly type: string;
  private readonly id: string;
  constructor(receiver: EditingReceiver, args: readonly string[]) {
    super(receiver); Validation.arity(args, 2, 10);
    this.type = args[0]!; this.id = args[1]!; this.args = args.slice(2);
    if (this.args.length >= 2 && this.args.at(-2) === 'in') {
      this.parentId = this.args.at(-1)!; this.args.splice(-2);
    }
  }
  protected override apply() { return this.receiver.create(this.type, this.id, this.args, this.parentId); }
}
