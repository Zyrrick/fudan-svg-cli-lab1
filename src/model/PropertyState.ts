import type { Shape } from './Shape.js';
import type { State } from './State.js';
export class PropertyState implements State {
  private readonly value: string | undefined;
  constructor(private readonly shape: Shape, private readonly attribute: string) { this.value = shape.details().get(attribute); }
  restore(): void { this.shape.restoreAttribute(this.attribute, this.value); }
}
