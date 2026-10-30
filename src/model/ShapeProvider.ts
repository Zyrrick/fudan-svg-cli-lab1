import type { Shape } from './Shape.js';
export interface ShapeProvider {
  create(type: string, id: string, args: readonly string[]): Shape;
  fromAttributes(type: string, id: string, attributes: ReadonlyMap<string, string>, content: string): Shape;
}
