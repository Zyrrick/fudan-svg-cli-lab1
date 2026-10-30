export class Validation {
  static number(value: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) throw new Error(`invalid number: ${value}`);
    return this.finite(Number(value));
  }
  static finite(value: number): number {
    if (!Number.isFinite(value)) throw new Error('number must be finite');
    return Object.is(value, -0) ? 0 : value;
  }
  static positive(value: number, message = 'value must be positive'): number {
    if (value <= 0) throw new Error(message);
    return this.finite(value);
  }
  static nonnegative(value: number): number {
    if (value < 0) throw new Error('size must be nonnegative');
    return this.finite(value);
  }
  static id(value: string): string {
    if (!value || /[\s\u0000-\u001f\u007f]/u.test(value)) throw new Error('id must be nonempty and contain no whitespace or control characters');
    return this.xmlText(value);
  }
  static xmlText(value: string): string {
    if (/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u.test(value)) throw new Error('invalid XML character');
    return value;
  }
  static arity(args: readonly string[], min: number, max = min): void {
    if (args.length < min || args.length > max) throw new Error(`expected ${min === max ? min : `${min}..${max}`} arguments, got ${args.length}`);
  }
  static escape(value: string): string {
    return this.xmlText(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;').replaceAll('\r', '&#13;').replaceAll('\n', '&#10;').replaceAll('\t', '&#9;');
  }
}
