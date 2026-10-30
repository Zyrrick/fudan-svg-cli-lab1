import { GeometricShape } from './GeometricShape.js';
export class Ellipse extends GeometricShape {
  constructor(id: string, args: readonly string[]) { super(id, 'ellipse', ['cx', 'cy', 'rx', 'ry'], ['cx'], ['cy'], ['rx', 'ry'], args, 'fill'); }
  protected override duplicate(): Ellipse { return new Ellipse(this.id, this.creationArgs()); }
}
