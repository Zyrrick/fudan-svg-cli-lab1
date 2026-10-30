import type { UndoableCommand } from '../commands/UndoableCommand.js';
export class History {
  private readonly past: UndoableCommand[] = [];
  private readonly future: UndoableCommand[] = [];
  private blocked = true;
  execute(command: UndoableCommand): string {
    const feedback = command.execute();
    this.past.push(command); this.future.length = 0; this.blocked = false; return feedback;
  }
  barrier(): void { this.past.length = 0; this.future.length = 0; this.blocked = true; }
  undo(): string {
    this.check(); const command = this.past.at(-1); if (!command) throw new Error('nothing to undo');
    const feedback = command.undo(); this.past.pop(); this.future.push(command); return feedback;
  }
  redo(): string {
    this.check(); const command = this.future.at(-1); if (!command) throw new Error('nothing to redo');
    const feedback = command.redo(); this.future.pop(); this.past.push(command); return feedback;
  }
  private check(): void { if (this.blocked) throw new Error('undo not allowed after io command'); }
}
