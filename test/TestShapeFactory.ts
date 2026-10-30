import { ShapeFactory } from '../src/model/ShapeFactory.js';
import { Shape } from '../src/model/Shape.js';
import { TestBranch } from './TestBranch.js';
import { TestLabel } from './TestLabel.js';
export class TestShapeFactory extends ShapeFactory {
  override create(type: string, id: string, args: readonly string[]): Shape {
    if (type === 'g') return new TestBranch(id);
    if (type === 'text') return new TestLabel(id, args);
    return super.create(type, id, args);
  }
}
