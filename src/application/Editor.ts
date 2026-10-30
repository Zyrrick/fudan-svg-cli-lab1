import { Command } from '../commands/Command.js';
import { Document } from '../model/Document.js';
import type { FilePort } from '../io/FilePort.js';
import { SvgCodec } from '../io/SvgCodec.js';
import { History } from './History.js';

export class Editor {
  private current: Document | undefined;
  private readPath: string | undefined;
  private readonly history = new History();
  constructor(private readonly files: FilePort, private readonly codec = new SvgCodec()) {}
  document(): Document { if (!this.current) throw new Error("no document. use 'init' or 'read' first"); return this.current; }
  init(width = 800, height = 600): string {
    const document = new Document(width, height);
    this.current = document; this.readPath = undefined; this.history.barrier();
    return `canvas ${width}x${height} created`;
  }
  read(path: string): string {
    let xml: string;
    try { xml = this.files.read(path); } catch { throw new Error(`cannot read file: ${path}`); }
    const { document, warnings } = this.codec.decode(xml);
    this.current = document; this.readPath = path; this.history.barrier();
    return [...warnings, `read ${path} (${document.all().length} elements)`].join('\n');
  }
  save(path?: string): string {
    const document = this.document(); const target = path ?? this.readPath;
    if (!target) throw new Error('no save path. use save <file.svg>');
    const xml = this.codec.encode(document);
    try { this.files.write(target, xml); } catch { throw new Error(`cannot write file: ${target}`); }
    this.history.barrier(); return `saved to ${target} (${document.all().length} elements)`;
  }
  canvas(width?: number, height?: number): string {
    const document = this.document();
    if (width !== undefined) { document.resize(width, height ?? document.height); this.history.barrier(); }
    return `canvas ${document.width}x${document.height}`;
  }
  execute(command: Command): string { return this.history.execute(command, this.document()); }
  undo(): string { return this.history.undo(this.document()); }
  redo(): string { return this.history.redo(this.document()); }
}
