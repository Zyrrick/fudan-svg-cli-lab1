import { Shape } from './Shape.js';
import { Validation } from './Validation.js';
export class Group extends Shape {
  private readonly nodes: Shape[] = [];
  constructor(id: string) { super(id, 'g'); }
  override children(): readonly Shape[] { return this.nodes.slice(); }
  add(shape: Shape, index = this.nodes.length): void {
    if (shape.contains(this)) throw new Error(`cannot add container into its own descendant: ${shape.id}`);
    if (shape.parent) throw new Error('shape must be detached before attachment');
    if (!Number.isInteger(index) || index < 0 || index > this.nodes.length) throw new Error('invalid child index');
    this.nodes.splice(index, 0, shape);
    shape.attach(this);
  }
  remove(shape: Shape): number {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error('shape is not a child');
    this.nodes.splice(index, 1); shape.attach(null); return index;
  }
  override move(dx: number, dy: number): void { this.nodes.forEach(child => child.move(dx, dy)); }
  override scale(factor: number): void {
    Validation.positive(factor, 'scale factor must be positive');
    this.nodes.forEach(child => child.scale(factor));
  }
  protected override duplicate(): Group {
    const copy = new Group(this.id); this.nodes.forEach(child => copy.add(child.clone())); return copy;
  }
  protected override geometry(): ReadonlyMap<string, string> { return new Map(); }
  protected override describeGeometry(): string { return ''; }
  protected override xmlBody(indent: string): string {
    return this.nodes.length ? `>\n${this.nodes.map(child => child.xml(indent + '  ')).join('\n')}\n${indent}</g>` : '/>';
  }
}
