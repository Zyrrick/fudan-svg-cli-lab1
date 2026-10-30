import { Shape } from './Shape.js';
import { Validation } from './Validation.js';
import { Hierarchy } from './Hierarchy.js';
import type { Container } from './Container.js';
import { GeometryState } from './GeometryState.js';
export class Group extends Shape implements Container {
  constructor(id: string) { super(id, 'g'); }
  get component(): Shape { return this; }
  override asContainer(): Container { return this; }
  override children(): readonly Shape[] { return Hierarchy.children(this); }
  add(shape: Shape, index?: number): void { Hierarchy.add(this, shape, index); }
  remove(shape: Shape): number { return Hierarchy.remove(this, shape); }
  override geometryTargets(): readonly Shape[] { return this.children().flatMap(child => child.geometryTargets()); }
  override move(dx: number, dy: number): void {
    Validation.finite(dx); Validation.finite(dy); const targets = this.geometryTargets(); const before = new GeometryState(targets);
    try { targets.forEach(child => child.move(dx, dy)); } catch (error) { before.restore(); throw error; }
  }
  override scale(factor: number): void {
    Validation.positive(factor, 'scale factor must be positive');
    const targets = this.geometryTargets(); const before = new GeometryState(targets);
    try { targets.forEach(child => child.scale(factor)); } catch (error) { before.restore(); throw error; }
  }
  override importChildren(children: readonly Shape[]): void { children.forEach(child => this.add(child)); }
  // Descendants already receive the composed import transform; applying it again would double it.
  override importTransform(_factor: number, _dx: number, _dy: number, _inherited: ReadonlyMap<string, string>): void {}
  protected override duplicate(): Group {
    const copy = new Group(this.id); this.children().forEach(child => copy.add(child.clone())); return copy;
  }
  protected override geometry(): ReadonlyMap<string, string> { return new Map(); }
  protected override describeGeometry(): string { return ''; }
  protected override xmlBody(indent: string): string {
    const children = this.children();
    return children.length ? `>\n${children.map(child => child.xml(indent + '  ')).join('\n')}\n${indent}</g>` : '/>';
  }
}
