import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class ScaleCommand extends Command {
  private readonly id: string;
  private readonly factor: number;
  constructor(args: readonly string[]) { super(); Validation.arity(args, 2); this.id = args[0]!; this.factor = Validation.positive(Validation.number(args[1]!), 'scale factor must be positive'); }
  protected override apply(document: Document): string {
    document.scale(this.id, this.factor); return `${document.find(this.id).label} scaled by ${this.factor}`;
  }
}
