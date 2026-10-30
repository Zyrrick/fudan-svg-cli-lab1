import { Shape } from '../src/model/Shape.js';
import { Hierarchy } from '../src/model/Hierarchy.js';
import { GeometryState } from '../src/model/GeometryState.js';
import type { Container } from '../src/model/Container.js';
/** Different container implementation, deliberately not a Group subclass. */
export class TestBranch extends Shape implements Container {
  constructor(id: string) { super(id, 'g'); }
  get component(): Shape { return this; }
  override asContainer(): Container { return this; }
  override children(): readonly Shape[] { return Hierarchy.children(this); }
  add(shape: Shape, index?: number): void { Hierarchy.add(this, shape, index); }
  remove(shape: Shape): number { return Hierarchy.remove(this, shape); }
  override geometryTargets(): readonly Shape[] { return this.children().flatMap(child => child.geometryTargets()); }
  override move(dx: number, dy: number): void {
    const targets = this.geometryTargets(); const before = new GeometryState(targets);
    try { targets.forEach(child => child.move(dx, dy)); } catch (error) { before.restore(); throw error; }
  }
  override scale(factor: number): void {
    const targets = this.geometryTargets(); const before = new GeometryState(targets);
    try { targets.forEach(child => child.scale(factor)); } catch (error) { before.restore(); throw error; }
  }
  override importChildren(children: readonly Shape[]): void { children.forEach(child => this.add(child)); }
  override importTransform(_factor: number, _dx: number, _dy: number, _inherited: ReadonlyMap<string, string>): void {}
  protected override geometry(): ReadonlyMap<string, string> { return new Map(); }
  protected override describeGeometry(): string { return ''; }
  protected override duplicate(): Shape { const copy = new TestBranch(this.id); this.children().forEach(child => copy.add(child.clone())); return copy; }
  protected override xmlBody(indent: string): string { return `>\n${this.children().map(child => child.xml(indent + '  ')).join('\n')}\n${indent}</g>`; }
}
