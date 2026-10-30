import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Validation } from './Validation.js';

export class Document {
  private root = new Group('__internal_canvas__');
  private widthValue: number;
  private heightValue: number;
  constructor(width = 800, height = 600) { this.widthValue = Validation.positive(width); this.heightValue = Validation.positive(height); }
  get width(): number { return this.widthValue; }
  get height(): number { return this.heightValue; }
  children(): readonly Shape[] { return this.root.children(); }
  resize(width: number, height: number): void { Validation.positive(width); Validation.positive(height); this.widthValue = width; this.heightValue = height; }
  all(): readonly Shape[] {
    const result: Shape[] = [];
    const visit = (node: Shape): void => { result.push(node); node.children().forEach(visit); };
    this.children().forEach(visit); return result;
  }
  find(id: string): Shape {
    const shape = this.all().find(shape => shape.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`); return shape;
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const shape = this.all().find(shape => shape.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`); return shape;
  }
  unique(id: string): void { Validation.id(id); if (this.all().some(shape => shape.id === id)) throw new Error(`id already exists: ${id}`); }
  add(shape: Shape, parentId?: string): void {
    const ids = new Set<string>();
    const check = (node: Shape): void => { this.unique(node.id); if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`); ids.add(node.id); node.children().forEach(check); };
    check(shape); this.container(parentId).add(shape);
  }
  delete(id: string): void { const shape = this.find(id); shape.parent!.remove(shape); }
  move(id: string, dx: number, dy: number): void { this.find(id).move(dx, dy); }
  scale(id: string, factor: number): void { this.find(id).scale(factor); }
  set(id: string, attribute: string, value: string): void { this.find(id).set(attribute, value); }
  group(id: string, selectedIds: readonly string[]): void {
    this.unique(id);
    if (!selectedIds.length) throw new Error('group requires at least one shape');
    if (new Set(selectedIds).size !== selectedIds.length) throw new Error('duplicate group member');
    const selected = selectedIds.map(id => this.find(id));
    for (const shape of selected) if (selected.some(other => other !== shape && shape.contains(other))) throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    // Canonical document preorder defines relative order across different parents.
    const ordered = this.all().filter(shape => selected.includes(shape));
    const group = new Group(id);
    ordered.forEach(shape => { shape.parent!.remove(shape); group.add(shape); });
    this.root.add(group);
  }
  ungroup(id: string): void {
    const group = this.container(id); const parent = group.parent!;
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const children = group.children(); const index = parent.remove(group);
    children.forEach((child, offset) => { group.remove(child); parent.add(child, index + offset); });
  }
  addto(groupId: string, id: string): void {
    const parent = this.container(groupId); const shape = this.find(id);
    if (shape.contains(parent)) throw new Error(`cannot add container into its own descendant: ${id}`);
    shape.parent!.remove(shape); parent.add(shape);
  }
  reorder(id: string, front: boolean): void {
    const shape = this.find(id); const parent = shape.parent!; parent.remove(shape); parent.add(shape, front ? parent.children().length : 0);
  }
  parentLabel(shape: Shape): string { return shape.parent === this.root ? 'svg' : shape.parent!.label; }
  clone(): Document { const copy = new Document(this.width, this.height); copy.root = this.root.clone() as Group; return copy; }
  restore(snapshot: Document): void { this.widthValue = snapshot.width; this.heightValue = snapshot.height; this.root = snapshot.root.clone() as Group; }
  xml(): string { return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n${this.children().map(shape => shape.xml('  ')).join('\n')}\n</svg>\n`; }
}
