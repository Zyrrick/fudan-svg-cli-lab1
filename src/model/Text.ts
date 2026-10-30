import { GeometricShape } from './GeometricShape.js';
import { Validation } from './Validation.js';
export class Text extends GeometricShape {
  private content: string;
  constructor(id: string, args: readonly string[]) {
    Validation.arity(args, 3);
    super(id, 'text', ['x', 'y'], ['x'], ['y'], [], args.slice(0, 2));
    this.content = Validation.xmlText(args[2]!);
  }
  protected override duplicate(): Text { return new Text(this.id, [...this.creationArgs(), this.content]); }
  override set(attribute: string, value: string): void {
    if (attribute === 'text') this.content = Validation.xmlText(value);
    else super.set(attribute, value);
  }
  protected override describeGeometry(): string { return `${super.describeGeometry()} ${JSON.stringify(this.content)}`; }
  protected override xmlBody(_indent: string): string { return `>${Validation.escape(this.content)}</text>`; }
  override attributes(): ReadonlyMap<string, string> { return super.attributes(); }
  get text(): string { return this.content; }
}
