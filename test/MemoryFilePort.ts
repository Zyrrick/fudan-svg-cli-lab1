import type { FilePort } from '../src/io/FilePort.js';
export class MemoryFilePort implements FilePort {
  private readonly content = new Map<string, string>();
  read(path: string): string { const result = this.content.get(path); if (result === undefined) throw new Error('missing'); return result; }
  write(path: string, value: string): void { if (path === 'blocked.svg') throw new Error('unwritable'); this.content.set(path, value); }
}
