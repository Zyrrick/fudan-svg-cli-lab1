import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class MoveCommand extends Command {
  private readonly id: string;
  private readonly dx: number;
  private readonly dy: number;
  constructor(args: readonly string[]) { super(); Validation.arity(args, 3); this.id = args[0]!; this.dx = Validation.number(args[1]!); this.dy = Validation.number(args[2]!); }
  protected override apply(document: Document): string {
    document.move(this.id, this.dx, this.dy); return `${document.find(this.id).label} moved by (${this.dx},${this.dy}): ${document.find(this.id).summary()}`;
  }
}
