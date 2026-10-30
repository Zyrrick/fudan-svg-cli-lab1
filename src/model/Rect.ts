import { GeometricShape } from './GeometricShape.js';
export class Rect extends GeometricShape {
  constructor(id: string, args: readonly string[]) { super(id, 'rect', ['x', 'y', 'width', 'height'], ['x'], ['y'], ['width', 'height'], args, 'fill'); }
  protected override duplicate(): Rect { return new Rect(this.id, this.creationArgs()); }
}
