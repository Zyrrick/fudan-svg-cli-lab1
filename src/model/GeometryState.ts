import type { Shape } from './Shape.js';
import type { State } from './State.js';
export class GeometryState implements State {
  private readonly entries: readonly { shape: Shape; values: ReadonlyMap<string, string> }[];
  constructor(shapes: readonly Shape[]) { this.entries = shapes.map(shape => ({ shape, values: shape.geometryValues() })); }
  restore(): void { this.entries.forEach(({ shape, values }) => values.forEach((value, key) => shape.set(key, value))); }
}
