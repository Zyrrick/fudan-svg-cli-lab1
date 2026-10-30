import { GeometricShape } from './GeometricShape.js';
export class Circle extends GeometricShape {
  constructor(id: string, args: readonly string[]) { super(id, 'circle', ['cx', 'cy', 'r'], ['cx'], ['cy'], ['r'], args, 'fill'); }
  protected override duplicate(): Circle { return new Circle(this.id, this.creationArgs()); }
}
