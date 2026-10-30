import type { Change } from './Change.js';
import type { State } from './State.js';
export class EditRecord implements Change {
  constructor(private readonly before: State, private readonly after: State, readonly feedback: string) {}
  undo(): void { this.before.restore(); }
  redo(): void { this.after.restore(); }
}
