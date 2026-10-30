import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class AddToCommand extends Command {
  private readonly groupId: string;
  private readonly id: string;
  constructor(args: readonly string[]) { super(); Validation.arity(args, 2); [this.groupId, this.id] = args as [string, string]; }
  protected override apply(document: Document): string { document.addto(this.groupId, this.id); return `${document.find(this.id).label} added to g#${this.groupId}`; }
}
