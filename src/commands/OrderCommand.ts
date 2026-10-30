import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class OrderCommand extends Command {
  private readonly id: string;
  constructor(args: readonly string[], private readonly front: boolean) { super(); Validation.arity(args, 1); this.id = args[0]!; }
  protected override apply(document: Document): string { document.reorder(this.id, this.front); return `${document.find(this.id).label} moved to ${this.front ? 'front' : 'back'}`; }
}
