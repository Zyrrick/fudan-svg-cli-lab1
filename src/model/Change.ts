export interface Change {
  readonly feedback: string;
  undo(): void;
  redo(): void;
}
