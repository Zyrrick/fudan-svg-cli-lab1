export interface UndoableCommand {
  execute(): string;
  undo(): string;
  redo(): string;
}
