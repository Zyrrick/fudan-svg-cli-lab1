import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class UngroupCommand extends Command {
  private readonly id: string;
  constructor(args: readonly string[]) { super(); Validation.arity(args, 1); this.id = args[0]!; }
  protected override apply(document: Document): string { document.ungroup(this.id); return `g#${this.id} ungrouped`; }
}
