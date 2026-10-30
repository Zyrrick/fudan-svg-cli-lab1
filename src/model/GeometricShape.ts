import { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export abstract class GeometricShape extends Shape {
  private readonly coordinates = new Map<string, number>();
  protected constructor(id: string, tag: string, private readonly keys: readonly string[], private readonly horizontal: readonly string[], private readonly vertical: readonly string[], private readonly sizes: readonly string[], args: readonly string[], style?: string) {
    super(id, tag);
    Validation.arity(args, keys.length, keys.length + (style ? 1 : 0));
    keys.forEach((key, index) => this.coordinates.set(key, this.validate(key, Validation.number(args[index]!))));
    if (style && args.length > keys.length) this.set(style, args[keys.length]!);
  }
  private validate(key: string, value: number): number {
    return this.sizes.includes(key) ? Validation.nonnegative(value) : Validation.finite(value);
  }
  protected creationArgs(): string[] { return this.keys.map(key => String(this.coordinates.get(key)!)); }
  protected override geometry(): ReadonlyMap<string, string> { return new Map(Array.from(this.coordinates, ([k, v]) => [k, String(v)])); }
  override move(dx: number, dy: number): void {
    const next = new Map(this.coordinates);
    this.horizontal.forEach(key => next.set(key, Validation.finite(next.get(key)! + dx)));
    this.vertical.forEach(key => next.set(key, Validation.finite(next.get(key)! + dy)));
    next.forEach((value, key) => this.coordinates.set(key, value));
  }
  override scale(factor: number): void {
    Validation.positive(factor, 'scale factor must be positive');
    const next = new Map(Array.from(this.coordinates, ([key, value]) => [key, Validation.finite(value * factor)]));
    next.forEach((value, key) => this.coordinates.set(key, value));
  }
  override set(attribute: string, value: string): void {
    if (this.coordinates.has(attribute)) this.coordinates.set(attribute, this.validate(attribute, Validation.number(value)));
    else super.set(attribute, value);
  }
  protected override describeGeometry(): string {
    return Array.from(this.coordinates, ([key, value]) => `${key === 'width' ? 'w' : key === 'height' ? 'h' : key}=${value}`).join(' ');
  }
}
