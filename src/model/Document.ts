import { Group } from './Group.js';
import { Shape } from './Shape.js';
import { Validation } from './Validation.js';
import { ShapeFactory } from './ShapeFactory.js';
import { GeometryState } from './GeometryState.js';
import { PropertyState } from './PropertyState.js';
import { PlacementState } from './PlacementState.js';
import { EditRecord } from './EditRecord.js';
import type { Container } from './Container.js';
import type { Change } from './Change.js';
import type { State } from './State.js';
import type { EditingReceiver } from './EditingReceiver.js';

export class Document implements EditingReceiver {
  private root: Container = new Group('__internal_canvas__');
  private readonly factory = new ShapeFactory();
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
  container(id?: string): Container {
    if (id === undefined) return this.root;
    const shape = this.all().find(shape => shape.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    return shape.asContainer();
  }
  unique(id: string): void { Validation.id(id); if (this.all().some(shape => shape.id === id)) throw new Error(`id already exists: ${id}`); }
  add(shape: Shape, parentId?: string): void {
    const ids = new Set<string>();
    const check = (node: Shape): void => { this.unique(node.id); if (ids.has(node.id)) throw new Error(`id already exists: ${node.id}`); ids.add(node.id); node.children().forEach(check); };
    check(shape); this.container(parentId).add(shape);
  }
  private commit(before: State, operation: () => void, captureAfter: () => State, feedback: () => string): Change {
    try { operation(); return new EditRecord(before, captureAfter(), feedback()); }
    catch (error) { before.restore(); throw error; }
  }
  create(type: string, id: string, args: readonly string[], parentId?: string): Change {
    this.unique(id); const shape = this.factory.create(type, id, args);
    return this.commit(new PlacementState([shape]), () => this.add(shape, parentId), () => new PlacementState([shape]),
      () => `${shape.label} created${parentId === undefined ? '' : ` in g#${parentId}`}`);
  }
  delete(id: string): Change {
    const shape = this.find(id);
    return this.commit(new PlacementState([shape]), () => { shape.parent!.remove(shape); }, () => new PlacementState([shape]), () => `${shape.label} deleted`);
  }
  move(id: string, dx: number, dy: number): Change {
    const shape = this.find(id); const targets = shape.geometryTargets();
    return this.commit(new GeometryState(targets), () => shape.move(dx, dy), () => new GeometryState(targets),
      () => `${shape.label} moved by (${dx},${dy}): ${shape.summary()}`);
  }
  scale(id: string, factor: number): Change {
    const shape = this.find(id); const targets = shape.geometryTargets();
    return this.commit(new GeometryState(targets), () => shape.scale(factor), () => new GeometryState(targets), () => `${shape.label} scaled by ${factor}`);
  }
  set(id: string, attribute: string, value: string): Change {
    const shape = this.find(id); const before = new PropertyState(shape, attribute);
    // Shape setters validate completely before assigning a field; failure has no partial mutation.
    shape.set(attribute, value);
    return new EditRecord(before, new PropertyState(shape, attribute), `${shape.label} updated: ${attribute}=${JSON.stringify(value)}`);
  }
  group(id: string, selectedIds: readonly string[]): Change {
    this.unique(id);
    if (!selectedIds.length) throw new Error('group requires at least one shape');
    if (new Set(selectedIds).size !== selectedIds.length) throw new Error('duplicate group member');
    const selected = selectedIds.map(id => this.find(id));
    for (const shape of selected) if (selected.some(other => other !== shape && shape.contains(other))) throw new Error(`cannot group a container into its own descendant: ${shape.id}`);
    const ordered = this.all().filter(shape => selected.includes(shape));
    const group = this.factory.create('g', id, []).asContainer(); const affected = [group.component, ...ordered];
    return this.commit(new PlacementState(affected), () => {
      ordered.forEach(shape => { shape.parent!.remove(shape); group.add(shape); }); this.root.add(group.component);
    }, () => new PlacementState(affected), () => `g#${id} created with ${selected.length} children`);
  }
  ungroup(id: string): Change {
    const group = this.container(id); const parent = group.component.parent!;
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const children = group.children(); const affected = [group.component, ...children];
    return this.commit(new PlacementState(affected), () => {
      const index = parent.remove(group.component);
      children.forEach((child, offset) => { group.remove(child); parent.add(child, index + offset); });
    }, () => new PlacementState(affected), () => `g#${id} ungrouped`);
  }
  addto(groupId: string, id: string): Change {
    const parent = this.container(groupId); const shape = this.find(id);
    if (shape.contains(parent.component)) throw new Error(`cannot add container into its own descendant: ${id}`);
    return this.commit(new PlacementState([shape]), () => { shape.parent!.remove(shape); parent.add(shape); },
      () => new PlacementState([shape]), () => `${shape.label} added to g#${groupId}`);
  }
  reorder(id: string, front: boolean): Change {
    const shape = this.find(id); const parent = shape.parent!;
    return this.commit(new PlacementState([shape]), () => { parent.remove(shape); parent.add(shape, front ? parent.children().length : 0); },
      () => new PlacementState([shape]), () => `${shape.label} moved to ${front ? 'front' : 'back'}`);
  }
  parentLabel(shape: Shape): string { return shape.parent === this.root ? 'svg' : shape.parent!.label; }
  // Explicit copy API remains available for callers; editing/history never uses it.
  clone(): Document { const copy = new Document(this.width, this.height); copy.root = this.root.component.clone().asContainer(); return copy; }
  restore(snapshot: Document): void { this.widthValue = snapshot.width; this.heightValue = snapshot.height; this.root = snapshot.root.component.clone().asContainer(); }
  xml(): string { return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n${this.children().map(shape => shape.xml('  ')).join('\n')}\n</svg>\n`; }
}
