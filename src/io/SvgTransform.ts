import { Shape } from '../model/Shape.js';
import { Text } from '../model/Text.js';
import { Validation } from '../model/Validation.js';

/** Restricted SVG affine transform: positive uniform scale plus translation. */
export class SvgTransform {
  constructor(private readonly factor = 1, private readonly dx = 0, private readonly dy = 0) {}
  static parse(value: string): SvgTransform {
    const number = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?';
    const expression = new RegExp(`^\\s*(?:translate\\(\\s*(${number})(?:[\\s,]+(${number}))?\\s*\\)|scale\\(\\s*(${number})(?:[\\s,]+(${number}))?\\s*\\))`);
    let remaining = value.trim(); let result = new SvgTransform();
    if (!remaining) throw new Error('unsupported SVG transform: empty transform');
    while (remaining) {
      const match = expression.exec(remaining);
      if (!match) throw new Error('unsupported SVG transform: only translate and positive uniform scale are supported');
      const local = match[1] !== undefined
        ? new SvgTransform(1, Validation.number(match[1]), match[2] === undefined ? 0 : Validation.number(match[2]))
        : new SvgTransform(Validation.positive(Validation.number(match[3]!), 'unsupported SVG transform: scale must be positive'));
      if (match[4] !== undefined && Validation.number(match[4]) !== Validation.number(match[3]!)) throw new Error('unsupported SVG transform: nonuniform scale');
      result = result.compose(local);
      remaining = remaining.slice(match[0].length).trimStart();
      if (remaining.startsWith(',')) remaining = remaining.slice(1).trimStart();
    }
    return result;
  }
  compose(local: SvgTransform): SvgTransform {
    return new SvgTransform(Validation.positive(Validation.finite(this.factor * local.factor)), Validation.finite(this.dx + this.factor * local.dx), Validation.finite(this.dy + this.factor * local.dy));
  }
  apply(shape: Shape, inherited: ReadonlyMap<string, string>): void {
    shape.scale(this.factor); shape.move(this.dx, this.dy);
    if (this.factor !== 1) {
      shape.importAttribute('stroke-width', String(Validation.finite(Validation.number(inherited.get('stroke-width') ?? '1') * this.factor)));
      if (shape instanceof Text) shape.importAttribute('font-size', String(Validation.finite(Validation.number(inherited.get('font-size') ?? '16') * this.factor)));
    }
  }
}
