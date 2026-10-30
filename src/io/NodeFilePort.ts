import { readFileSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FilePort } from './FilePort.js';
export class NodeFilePort implements FilePort {
  read(path: string): string { return readFileSync(path, 'utf8'); }
  write(path: string, content: string): void {
    const temporary = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`);
    try { writeFileSync(temporary, content, { encoding: 'utf8', flag: 'wx' }); renameSync(temporary, path); }
    finally { rmSync(temporary, { force: true }); }
  }
}
