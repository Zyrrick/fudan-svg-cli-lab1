import { Command } from './Command.js';
import { Document } from '../model/Document.js';
import { Validation } from '../model/Validation.js';
export class SetCommand extends Command {
  private readonly id: string;
  private readonly attribute: string;
  private readonly value: string;
  constructor(args: readonly string[]) { super(); Validation.arity(args, 3); [this.id, this.attribute, this.value] = args as [string, string, string]; }
  protected override apply(document: Document): string {
    document.set(this.id, this.attribute, this.value); return `${document.find(this.id).label} updated: ${this.attribute}=${JSON.stringify(this.value)}`;
  }
}
