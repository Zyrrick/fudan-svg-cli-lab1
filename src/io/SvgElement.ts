import { Shape } from '../model/Shape.js';
import { Group } from '../model/Group.js';
import { Text } from '../model/Text.js';
import { ShapeFactory } from '../model/ShapeFactory.js';

/** Private XML parse tree, discarded after validated conversion to the model. */
export class SvgElement {
  private readonly nodes: SvgElement[] = [];
  private content = '';
  constructor(private readonly tagName: string, private readonly values: ReadonlyMap<string, string>) {}
  get name(): string { return this.tagName; }
  get attributes(): ReadonlyMap<string, string> { return new Map(this.values); }
  get text(): string { return this.content; }
  children(): readonly SvgElement[] { return this.nodes.slice(); }
  add(child: SvgElement): void { this.nodes.push(child); }
  append(text: string): void { this.content += text; }
  collect(): readonly SvgElement[] { return [this, ...this.nodes.flatMap(node => node.collect())]; }
  toShape(factory: ShapeFactory, allocated: ReadonlyMap<SvgElement, string>): Shape {
    if (this.values.has('transform')) throw new Error('unsupported SVG attribute: transform (flatten transforms before importing)');
    const shape = factory.fromAttributes(this.name, allocated.get(this)!, this.values, this.content);
    if (shape instanceof Group) {
      if (this.content.trim()) throw new Error('unexpected text inside <g>');
      this.nodes.forEach(child => shape.add(child.toShape(factory, allocated)));
    } else {
      if (this.nodes.length) throw new Error(`unsupported child element in <${this.name}>`);
      if (!(shape instanceof Text) && this.content.trim()) throw new Error(`unexpected text inside <${this.name}>`);
    }
    return shape;
  }
}
