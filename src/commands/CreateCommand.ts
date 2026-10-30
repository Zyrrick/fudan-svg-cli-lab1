import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { Validation } from '../model/Validation.js';
export class CreateCommand extends Command {
  private readonly args: string[];
  private readonly parentId: string | undefined;
  private readonly type: string;
  private readonly id: string;
  constructor(args: readonly string[]) {
    super(); Validation.arity(args, 2, 10);
    this.type = args[0]!; this.id = args[1]!; this.args = args.slice(2);
    if (this.args.length >= 2 && this.args.at(-2) === 'in') {
      this.parentId = this.args.at(-1)!; this.args.splice(-2);
    }
  }
  protected override apply(document: Document): string {
    document.unique(this.id);
    const shape = new ShapeFactory().create(this.type, this.id, this.args);
    document.add(shape, this.parentId);
    return `${shape.label} created${this.parentId === undefined ? '' : ` in g#${this.parentId}`}`;
  }
}
