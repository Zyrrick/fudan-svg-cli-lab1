import { GeometricShape } from './GeometricShape.js';
export class Line extends GeometricShape {
  constructor(id: string, args: readonly string[]) { super(id, 'line', ['x1', 'y1', 'x2', 'y2'], ['x1', 'x2'], ['y1', 'y2'], [], args, 'stroke'); }
  protected override duplicate(): Line { return new Line(this.id, this.creationArgs()); }
}
