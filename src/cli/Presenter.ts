import { Document } from '../model/Document.js';
import { Shape } from '../model/Shape.js';
export class Presenter {
  tree(document: Document, id?: string): string {
    if (id !== undefined) {
      const shape = document.find(id);
      return [shape.summary(), ...this.branches(shape.children(), '')].join('\n');
    }
    return [`svg (${document.width}x${document.height})`, ...this.branches(document.children(), '')].join('\n');
  }
  private branches(shapes: readonly Shape[], prefix: string): string[] {
    return shapes.flatMap((shape, index) => {
      const last = index === shapes.length - 1;
      return [`${prefix}${last ? '└── ' : '├── '}${shape.summary()}`, ...this.branches(shape.children(), prefix + (last ? '    ' : '│   '))];
    });
  }
  show(document: Document, id: string): string {
    const shape = document.find(id);
    return [`${shape.label}  parent=${document.parentLabel(shape)}`, ...Array.from(shape.details()).filter(([key]) => key !== 'id').map(([key, value]) => `  ${key}=${JSON.stringify(value)}`)].join('\n');
  }
  help(): string {
    return `Document (successful writes reset undo/redo):
  init [w] [h]                  defaults: 800 600
  read <file.svg>
  save [file.svg]                defaults to current read/save path
  canvas [w] [h]                 no args: inspect; one arg: width only
Editable shapes:
  create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]
  create circle <id> <cx> <cy> <r> [fill] [in <containerId>]
  create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]
  create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]
  create text <id> <x> <y> "content" [in <containerId>]
  create g <id> [in <containerId>]
  delete <id>
  move <id> <dx> <dy>
  scale <id> <factor>             positive; positions and sizes scale
  set <id> <attr> <value>
    shared: fill stroke stroke-width
    rect: x y width height; circle: cx cy r; ellipse: cx cy rx ry
    line: x1 y1 x2 y2; text: x y text; g: shared only
  group <newGid> <id1> <id2>...   document order; new group at root end
  ungroup <gid>                  nested g only; promote in place
  addto <gid> <id>               append; cycles forbidden
  front <id> / back <id>         last/first sibling in SVG paint order
  undo / redo
Display:
  tree [id]
  show <id>
  help
Whole-line # comments; quote arguments with spaces; escape quotes as \\".
End input (Ctrl-D) to quit. Unsupported types (including box) are errors.`;
  }
}
