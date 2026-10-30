import type { EditingReceiver } from '../model/EditingReceiver.js';
import type { Change } from '../model/Change.js';
import type { BoundCommand } from './BoundCommand.js';

/** Bound request; the receiver owns business validation and precise local state. */
export abstract class Command implements BoundCommand {
  private change: Change | undefined;
  private status: 'new' | 'done' | 'undone' = 'new';
  protected constructor(protected readonly receiver: EditingReceiver) {}
  isBoundTo(receiver: EditingReceiver): boolean { return this.receiver === receiver; }
  protected abstract apply(): Change;
  execute(): string {
    if (this.status !== 'new') throw new Error('command already executed');
    const change = this.apply(); this.change = change; this.status = 'done'; return change.feedback;
  }
  undo(): string {
    if (this.status !== 'done' || !this.change) throw new Error('command is not ready to undo');
    this.change.undo(); this.status = 'undone'; return `undone: ${this.change.feedback}`;
  }
  redo(): string {
    if (this.status !== 'undone' || !this.change) throw new Error('command is not ready to redo');
    this.change.redo(); this.status = 'done'; return `redone: ${this.change.feedback}`;
  }
}
