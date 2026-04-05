import { useState } from 'react';
import type { ChoreOccurrence, TeamMember } from '../../api/types';
import { assignOccurrence, completeOccurrence } from '../../api';
import { format, parseISO } from 'date-fns';

interface Props {
  occurrence: ChoreOccurrence;
  members: TeamMember[];
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700' },
};

export default function OccurrenceModal({ occurrence, members, onClose, onUpdated }: Props) {
  const [occ, setOcc] = useState<ChoreOccurrence>(occurrence);
  const [assignedTo, setAssignedTo] = useState<number | ''>(occurrence.assigned_to ?? '');
  const [completingAs, setCompletingAs] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  const isCompleted = occ.status === 'completed';
  const statusInfo = STATUS_LABELS[occ.status] ?? STATUS_LABELS['pending'];

  const handleClose = () => {
    if (dirty) onUpdated();
    else onClose();
  };

  const handleAssign = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await assignOccurrence(occ.id, assignedTo === '' ? null : Number(assignedTo));
      setOcc(updated);
      setDirty(true);
    } catch {
      setError('Failed to assign.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (completingAs === '') { setError('Please confirm who you are.'); return; }
    if (completingAs !== occ.assigned_to) {
      setError('Only the assigned person can mark this chore as done.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await completeOccurrence(occ.id, Number(completingAs));
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">{occ.chore_title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(parseISO(occ.due_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4">&times;</button>
        </div>

        {occ.chore_description && (
          <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-lg p-3">
            {occ.chore_description}
          </p>
        )}

        <div className="mb-4">
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        {isCompleted ? (
          <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
            Completed by <strong>{occ.completed_name}</strong>
            {occ.completed_at && (
              <> on {format(parseISO(occ.completed_at), 'MMM d, yyyy h:mm a')}</>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assigned to</label>
              <div className="flex gap-2">
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value === '' ? '' : Number(e.target.value))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={loading}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {occ.assigned_to !== null && (
              <div>
                <label className="block text-sm font-medium mb-1">Complete as</label>
                <p className="text-xs text-gray-500 mb-1.5">
                  Only <strong>{occ.assigned_name}</strong> can mark this done.
                </p>
                <div className="flex gap-2">
                  <select
                    value={completingAs}
                    onChange={(e) => setCompletingAs(e.target.value === '' ? '' : Number(e.target.value))}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">I am...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleComplete}
                    disabled={loading || completingAs === ''}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}
