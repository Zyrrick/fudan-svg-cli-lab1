import { SaxesParser } from 'saxes';
import { Document } from '../model/Document.js';
import { ShapeFactory } from '../model/ShapeFactory.js';
import { Validation } from '../model/Validation.js';
import { SvgElement } from './SvgElement.js';

export class SvgCodec {
  decode(xml: string): { document: Document; warnings: readonly string[] } {
    if (Buffer.byteLength(xml, 'utf8') > 10 * 1024 * 1024) throw new Error('SVG exceeds 10 MiB limit');
    const parser = new SaxesParser({ xmlns: false });
    const stack: SvgElement[] = []; let root: SvgElement | undefined; let count = 0;
    parser.on('error', error => { throw new Error(`invalid SVG: ${error.message}`); });
    parser.on('doctype', () => { throw new Error('unsupported SVG: DOCTYPE is forbidden'); });
    parser.on('processinginstruction', () => { throw new Error('unsupported SVG processing instruction'); });
    parser.on('opentag', tag => {
      if (++count > 100000 || stack.length > 200) throw new Error('SVG structure exceeds safety limit');
      const node = new SvgElement(tag.name, new Map(Object.entries(tag.attributes)));
      if (stack.length) stack.at(-1)!.add(node); else root = node;
      stack.push(node);
    });
    parser.on('text', value => stack.at(-1)?.append(value));
    parser.on('cdata', value => stack.at(-1)?.append(value));
    parser.on('closetag', () => { stack.pop(); });
    parser.write(xml).close();
    if (!root || root.name !== 'svg') throw new Error('expected <svg> root');
    if (root.text.trim()) throw new Error('unexpected text inside <svg>');
    const attrs = root.attributes;
    for (const key of attrs.keys()) if (!['xmlns', 'width', 'height', 'viewBox'].includes(key)) throw new Error(`unsupported SVG root attribute: ${key}`);
    if (attrs.has('xmlns') && attrs.get('xmlns') !== 'http://www.w3.org/2000/svg') throw new Error('unsupported SVG namespace');
    const width = this.dimension(attrs.get('width') ?? '800'); const height = this.dimension(attrs.get('height') ?? '600');
    if (attrs.has('viewBox')) {
      const values = attrs.get('viewBox')!.trim().split(/[\s,]+/).map(value => Validation.number(value));
      if (values.length !== 4 || values.some((value, index) => value !== [0, 0, width, height][index])) throw new Error('unsupported SVG viewBox: must match canvas coordinates');
    }
    const elements = root.children().flatMap(node => node.collect());
    const reserved = new Set<string>(); const allocated = new Map<SvgElement, string>(); const warnings: string[] = [];
    for (const element of elements) {
      const id = element.attributes.get('id');
      if (id !== undefined) {
        Validation.id(id);
        if (reserved.has(id)) throw new Error(`id already exists: ${id}`);
        reserved.add(id); allocated.set(element, id);
      }
    }
    const counters = new Map<string, number>();
    for (const element of elements) {
      if (allocated.has(element)) continue;
      let serial = counters.get(element.name) ?? 0; let id: string;
      do { id = `${element.name}${++serial}`; } while (reserved.has(id));
      counters.set(element.name, serial); reserved.add(id); allocated.set(element, id);
      warnings.push(`warning: assigned id ${id} to unnamed <${element.name}>`);
    }
    const document = new Document(width, height); const factory = new ShapeFactory();
    root.children().forEach(element => document.add(element.toShape(factory, allocated)));
    return { document, warnings };
  }
  encode(document: Document): string { return document.xml(); }
  private dimension(value: string): number { return Validation.positive(Validation.number(value.replace(/px$/, ''))); }
}
