import type { EditingReceiver } from '../src/model/EditingReceiver.js';
import type { Change } from '../src/model/Change.js';
export class ReceiverProbe implements EditingReceiver {
  private readonly events: { operation: string; args: readonly unknown[] }[] = [];
  failure = '';
  calls(): readonly { operation: string; args: readonly unknown[] }[] { return this.events.slice(); }
  private record(operation: string, args: readonly unknown[]): Change {
    this.events.push({ operation, args }); if (this.failure === 'execute') throw new Error('receiver failed');
    return { feedback: 'receiver result', undo: () => { if (this.failure === 'undo') throw new Error('undo failed'); this.events.push({ operation: 'undo', args: [] }); }, redo: () => { if (this.failure === 'redo') throw new Error('redo failed'); this.events.push({ operation: 'redo', args: [] }); } };
  }
  create(...args: Parameters<EditingReceiver['create']>): Change { return this.record('create', args); }
  delete(...args: Parameters<EditingReceiver['delete']>): Change { return this.record('delete', args); }
  move(...args: Parameters<EditingReceiver['move']>): Change { return this.record('move', args); }
  scale(...args: Parameters<EditingReceiver['scale']>): Change { return this.record('scale', args); }
  set(...args: Parameters<EditingReceiver['set']>): Change { return this.record('set', args); }
  group(...args: Parameters<EditingReceiver['group']>): Change { return this.record('group', args); }
  ungroup(...args: Parameters<EditingReceiver['ungroup']>): Change { return this.record('ungroup', args); }
  addto(...args: Parameters<EditingReceiver['addto']>): Change { return this.record('addto', args); }
  reorder(...args: Parameters<EditingReceiver['reorder']>): Change { return this.record('reorder', args); }
}
