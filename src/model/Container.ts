import type { Shape } from './Shape.js';
export interface Container {
  readonly component: Shape;
  readonly id: string;
  readonly label: string;
  children(): readonly Shape[];
  add(shape: Shape, index?: number): void;
  remove(shape: Shape): number;
}
