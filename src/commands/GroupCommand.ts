import { Command } from './Command.js';
import type { EditingReceiver } from '../model/EditingReceiver.js';
import { Validation } from '../model/Validation.js';
export class GroupCommand extends Command {
  private readonly id: string;
  private readonly members: readonly string[];
  constructor(receiver: EditingReceiver, args: readonly string[]) { super(receiver); Validation.arity(args, 2, Number.MAX_SAFE_INTEGER); this.id = args[0]!; this.members = args.slice(1); }
  protected override apply() { return this.receiver.group(this.id, this.members); }
}
