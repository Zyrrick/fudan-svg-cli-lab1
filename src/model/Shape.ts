import { Validation } from './Validation.js';
import type { Container } from './Container.js';
import { Hierarchy } from './Hierarchy.js';

export abstract class Shape {
  private readonly presentation = new Map<string, string>();
  protected constructor(private readonly shapeId: string, private readonly tag: string) { Validation.id(shapeId); }
  get id(): string { return this.shapeId; }
  get type(): string { return this.tag; }
  get label(): string { return `${this.type}#${this.id}`; }
  get parent(): Container | null { return Hierarchy.parent(this); }
  asContainer(): Container { throw new Error(`not a container: ${this.id}`); }
  children(): readonly Shape[] { return []; }
  geometryTargets(): readonly Shape[] { return [this]; }
  geometryValues(): ReadonlyMap<string, string> { return this.geometry(); }
  restoreAttribute(attribute: string, value: string | undefined): void {
    if (value === undefined) this.presentation.delete(attribute); else this.set(attribute, value);
  }
  importArguments(attributes: ReadonlyMap<string, string>, content: string): readonly string[] {
    return [...Array.from(this.geometry().keys(), key => attributes.get(key) ?? '0'), ...this.contentParameters(content)];
  }
  protected contentParameters(content: string): readonly string[] {
    if (content.trim()) throw new Error(`unexpected text inside <${this.type}>`); return [];
  }
  importChildren(children: readonly Shape[]): void { if (children.length) throw new Error(`unsupported child element in <${this.type}>`); }
  importTransform(factor: number, dx: number, dy: number, inherited: ReadonlyMap<string, string>): void {
    this.scale(factor); this.move(dx, dy);
    if (factor !== 1) this.importAttribute('stroke-width', String(Validation.finite(Validation.number(inherited.get('stroke-width') ?? '1') * factor)));
  }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  protected abstract duplicate(): Shape;
  protected abstract geometry(): ReadonlyMap<string, string>;
  protected abstract describeGeometry(): string;
  clone(): Shape {
    const copy = this.duplicate();
    this.presentation.forEach((value, key) => copy.presentation.set(key, value));
    return copy;
  }
  set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) throw new Error(`unknown attribute: ${attribute}`);
    if (['fill', 'stroke'].includes(attribute) && /url\s*\(|\\/iu.test(value)) throw new Error('unsupported SVG paint: resource references are forbidden');
    if (attribute === 'stroke-width') value = String(Validation.nonnegative(Validation.number(value)));
    this.presentation.set(attribute, Validation.xmlText(value));
  }
  importAttribute(attribute: string, value: string): void {
    // Preserve these safe SVG text presentation attributes, without extending CLI set.
    if (attribute === 'font-size') {
      this.presentation.set(attribute, String(Validation.nonnegative(Validation.number(value))));
    } else if (attribute === 'text-anchor' && ['start', 'middle', 'end'].includes(value)) {
      this.presentation.set(attribute, value);
    } else this.set(attribute, value);
  }
  attributes(): ReadonlyMap<string, string> {
    return new Map([['id', this.id], ...this.geometry(), ...this.presentation]);
  }
  details(): ReadonlyMap<string, string> { return this.attributes(); }
  summary(): string {
    return [this.label, this.describeGeometry(), ...Array.from(this.presentation, ([k, v]) => `${k}=${JSON.stringify(v).replace(/^"([^"\\\s]*)"$/, '$1')}`)].filter(Boolean).join('  ');
  }
  xml(indent = ''): string {
    const attributes = Array.from(this.attributes(), ([k, v]) => `${k}="${Validation.escape(v)}"`).join(' ');
    return `${indent}<${this.type} ${attributes}${this.xmlBody(indent)}`;
  }
  protected xmlBody(_indent: string): string { return '/>'; }
  count(): number { return 1 + this.children().reduce((total, child) => total + child.count(), 0); }
  contains(shape: Shape): boolean { return this === shape || this.children().some(child => child.contains(shape)); }
}
