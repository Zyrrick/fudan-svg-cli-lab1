import type { EditingReceiver } from '../model/EditingReceiver.js';
import type { UndoableCommand } from './UndoableCommand.js';
export interface BoundCommand extends UndoableCommand {
  isBoundTo(receiver: EditingReceiver): boolean;
}
