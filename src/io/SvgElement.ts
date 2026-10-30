import { Shape } from '../model/Shape.js';
import { Group } from '../model/Group.js';
import { Text } from '../model/Text.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { SvgTransform } from './SvgTransform.js';

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
  toShape(factory: ShapeFactory, allocated: ReadonlyMap<SvgElement, string>, parentTransform = new SvgTransform(), inherited: ReadonlyMap<string, string> = new Map()): Shape {
    const attributes = new Map(this.values); attributes.delete('transform');
    const transform = this.values.has('transform') ? parentTransform.compose(SvgTransform.parse(this.values.get('transform')!)) : parentTransform;
    const effective = new Map([...inherited, ...attributes]);
    const shape = factory.fromAttributes(this.name, allocated.get(this)!, attributes, this.content);
    if (shape instanceof Group) {
      if (this.content.trim()) throw new Error('unexpected text inside <g>');
      this.nodes.forEach(child => shape.add(child.toShape(factory, allocated, transform, effective)));
    } else {
      if (this.nodes.length) throw new Error(`unsupported child element in <${this.name}>`);
      if (!(shape instanceof Text) && this.content.trim()) throw new Error(`unexpected text inside <${this.name}>`);
      transform.apply(shape, effective);
    }
    return shape;
  }
}
