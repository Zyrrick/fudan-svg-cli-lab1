import { Command } from '../commands/Command.js';
import { Document } from '../model/Document.js';
export class History {
  private readonly past: Command[] = [];
  private readonly future: Command[] = [];
  private blocked = true;
  execute(command: Command, document: Document): string {
    const feedback = command.execute(document);
    this.past.push(command); this.future.length = 0; this.blocked = false; return feedback;
  }
  barrier(): void { this.past.length = 0; this.future.length = 0; this.blocked = true; }
  undo(document: Document): string {
    this.check(); const command = this.past.at(-1); if (!command) throw new Error('nothing to undo');
    const feedback = command.undo(document); this.past.pop(); this.future.push(command); return feedback;
  }
  redo(document: Document): string {
    this.check(); const command = this.future.at(-1); if (!command) throw new Error('nothing to redo');
    const feedback = command.redo(document); this.future.pop(); this.past.push(command); return feedback;
  }
  private check(): void { if (this.blocked) throw new Error('undo not allowed after io command'); }
}
