import type { Shape } from './Shape.js';
import type { Container } from './Container.js';

/** Owns both sides of every link; there is deliberately no parent-only setter. */
export class Hierarchy {
  private static readonly parents = new WeakMap<Shape, Container>();
  private static readonly nodes = new WeakMap<Container, Shape[]>();
  static parent(shape: Shape): Container | null { return this.parents.get(shape) ?? null; }
  static children(parent: Container): readonly Shape[] { return (this.nodes.get(parent) ?? []).slice(); }
  static add(parent: Container, shape: Shape, index = this.children(parent).length): void {
    if (shape.contains(parent.component)) throw new Error(`cannot add container into its own descendant: ${shape.id}`);
    if (this.parents.has(shape)) throw new Error('shape must be detached before attachment');
    const children = this.nodes.get(parent) ?? [];
    if (!Number.isInteger(index) || index < 0 || index > children.length) throw new Error('invalid child index');
    children.splice(index, 0, shape); this.nodes.set(parent, children); this.parents.set(shape, parent);
  }
  static remove(parent: Container, shape: Shape): number {
    const children = this.nodes.get(parent) ?? []; const index = children.indexOf(shape);
    if (index < 0) throw new Error('shape is not a child');
    children.splice(index, 1); this.parents.delete(shape); return index;
  }
}
