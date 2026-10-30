import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class DeleteCommand extends Command {
  private readonly id: string;
  constructor(args: readonly string[]) { super(); Validation.arity(args, 1); this.id = args[0]!; }
  protected override apply(document: Document): string {
    const label = document.find(this.id).label; document.delete(this.id); return `${label} deleted`;
  }
}
