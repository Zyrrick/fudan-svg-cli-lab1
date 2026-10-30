import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class GroupCommand extends Command {
  private readonly id: string;
  private readonly members: readonly string[];
  constructor(args: readonly string[]) { super(); Validation.arity(args, 2, Number.MAX_SAFE_INTEGER); this.id = args[0]!; this.members = args.slice(1); }
  protected override apply(document: Document): string { document.group(this.id, this.members); return `g#${this.id} created with ${this.members.length} children`; }
}
