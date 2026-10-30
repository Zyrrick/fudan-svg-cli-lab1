import { GeometricShape } from '../src/model/GeometricShape.js';
import { Validation } from '../src/model/Validation.js';
/** Different text implementation, deliberately not a Text subclass. */
export class TestLabel extends GeometricShape {
  private content: string;
  constructor(id: string, args: readonly string[]) { super(id, 'text', ['x', 'y'], ['x'], ['y'], [], args.slice(0, 2)); this.content = args[2]!; }
  protected override contentParameters(content: string): readonly string[] { return [content]; }
  override set(attribute: string, value: string): void { if (attribute === 'text') this.content = Validation.xmlText(value); else super.set(attribute, value); }
  override importTransform(factor: number, dx: number, dy: number, inherited: ReadonlyMap<string, string>): void {
    super.importTransform(factor, dx, dy, inherited);
    if (factor !== 1) this.importAttribute('font-size', String(Validation.number(inherited.get('font-size') ?? '16') * factor));
  }
  protected override duplicate(): TestLabel { return new TestLabel(this.id, [...this.creationArgs(), this.content]); }
  protected override xmlBody(_indent: string): string { return `>${Validation.escape(this.content)}</text>`; }
}
