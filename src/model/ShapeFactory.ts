import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
import { Validation } from './Validation.js';

export class ShapeFactory {
  // Name dispatch 1/2: intentionally centralized, to revisit in the plugin phase.
  private readonly creators = new Map<string, { build: (id: string, args: readonly string[]) => Shape; defaults: readonly string[] }>([
    ['rect', { build: (id, args) => new Rect(id, args), defaults: ['0', '0', '0', '0'] }],
    ['circle', { build: (id, args) => new Circle(id, args), defaults: ['0', '0', '0'] }],
    ['ellipse', { build: (id, args) => new Ellipse(id, args), defaults: ['0', '0', '0', '0'] }],
    ['line', { build: (id, args) => new Line(id, args), defaults: ['0', '0', '0', '0'] }],
    ['text', { build: (id, args) => new Text(id, args), defaults: ['0', '0', ''] }],
    ['g', { build: (id, args) => { Validation.arity(args, 0); return new Group(id); }, defaults: [] }],
  ]);
  create(type: string, id: string, args: readonly string[]): Shape {
    const create = this.creators.get(type);
    if (!create) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return create.build(id, args);
  }
  fromAttributes(type: string, id: string, attributes: ReadonlyMap<string, string>, content: string): Shape {
    // Ask a polymorphic prototype for its schema; no second tag-based dispatch.
    const prototype = this.create(type, id, this.defaults(type));
    const keys = Array.from(prototype.attributes().keys()).filter(key => key !== 'id');
    const args = keys.map(key => attributes.get(key) ?? '0');
    if (prototype instanceof Text) args.push(content);
    const shape = this.create(type, id, args);
    attributes.forEach((value, key) => {
      if (key !== 'id' && !keys.includes(key)) shape.importAttribute(key, value);
    });
    return shape;
  }
  private defaults(type: string): string[] {
    // Constructor arity metadata belongs to the same single factory dispatch table.
    const definition = this.creators.get(type);
    if (!definition) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return [...definition.defaults];
  }
}
