import type { Shape } from './Shape.js';
import type { Container } from './Container.js';
import type { State } from './State.js';
export class PlacementState implements State {
  private readonly positions: readonly { shape: Shape; parent: Container | null; index: number }[];
  constructor(shapes: readonly Shape[]) {
    this.positions = shapes.map(shape => ({ shape, parent: shape.parent, index: shape.parent?.children().indexOf(shape) ?? -1 }));
  }
  restore(): void {
    const current = new PlacementState(this.positions.map(position => position.shape));
    try { this.apply(); } catch (error) { current.apply(); throw error; }
  }
  private apply(): void {
    this.positions.forEach(({ shape }) => shape.parent?.remove(shape));
    const parents = new Map<Container, { shape: Shape; index: number }[]>();
    for (const { shape, parent, index } of this.positions) {
      if (parent) { const siblings = parents.get(parent) ?? []; siblings.push({ shape, index }); parents.set(parent, siblings); }
    }
    parents.forEach((siblings, parent) => siblings.sort((a, b) => a.index - b.index).forEach(({ shape, index }) => parent.add(shape, index)));
  }
}
