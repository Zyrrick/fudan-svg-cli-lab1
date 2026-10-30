import { Document } from '../model/Document.js';

/** Command owns its mementos; only a successful apply becomes one history unit. */
export abstract class Command {
  private before?: Document;
  private after?: Document;
  private feedback = '';
  protected abstract apply(document: Document): string;
  execute(document: Document): string {
    const before = document.clone();
    try {
      const feedback = this.apply(document);
      const after = document.clone();
      this.before = before; this.after = after; this.feedback = feedback;
      return feedback;
    } catch (error) { document.restore(before); throw error; }
  }
  undo(document: Document): string {
    if (!this.before) throw new Error('command has not executed');
    document.restore(this.before); return `undone: ${this.feedback}`;
  }
  redo(document: Document): string {
    if (!this.after) throw new Error('command has not executed');
    document.restore(this.after); return `redone: ${this.feedback}`;
  }
}
