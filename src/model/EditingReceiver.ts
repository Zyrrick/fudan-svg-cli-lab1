import type { Change } from './Change.js';
export interface EditingReceiver {
  create(type: string, id: string, args: readonly string[], parentId?: string): Change;
  delete(id: string): Change;
  move(id: string, dx: number, dy: number): Change;
  scale(id: string, factor: number): Change;
  set(id: string, attribute: string, value: string): Change;
  group(id: string, members: readonly string[]): Change;
  ungroup(id: string): Change;
  addto(groupId: string, id: string): Change;
  reorder(id: string, front: boolean): Change;
}
