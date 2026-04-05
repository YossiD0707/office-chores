import { useState } from 'react';
import type { TeamMember } from '../../api/types';
import { createTeamMember, deleteTeamMember, updateTeamMemberColor } from '../../api';

const PALETTE = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

interface Props {
  members: TeamMember[];
  onClose: () => void;
  onChanged: () => void;
}

export default function TeamPanel({ members, onClose, onChanged }: Props) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickingColorFor, setPickingColorFor] = useState<number | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createTeamMember(name.trim());
      setName('');
      onChanged();
    } catch {
      setError('Failed to add team member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await deleteTeamMember(id);
      onChanged();
    } catch {
      setError('Failed to remove team member.');
    }
  };

  const handleColorPick = async (id: number, color: string) => {
    setPickingColorFor(null);
    try {
      await updateTeamMemberColor(id, color);
      onChanged();
    } catch {
      setError('Failed to update color.');
    }
  };

  const getMemberColor = (m: TeamMember) =>
    m.color || PALETTE[members.indexOf(m) % PALETTE.length];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Team Members</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Member name"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <ul className="divide-y">
          {members.length === 0 && (
            <li className="py-3 text-sm text-gray-400">No team members yet.</li>
          )}
          {members.map((m) => (
            <li key={m.id} className="py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    title="Click to change color"
                    onClick={() => setPickingColorFor(pickingColorFor === m.id ? null : m.id)}
                    className="w-5 h-5 rounded-full border-2 border-white shadow flex-shrink-0 hover:scale-110 transition-transform"
                    style={{ backgroundColor: getMemberColor(m) }}
                  />
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </div>
              {pickingColorFor === m.id && (
                <div className="flex gap-2 mt-2 pl-7 flex-wrap">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      title={c}
                      onClick={() => handleColorPick(m.id, c)}
                      className={`w-6 h-6 rounded-full border-2 hover:scale-110 transition-transform ${
                        getMemberColor(m) === c ? 'border-gray-800 scale-110' : 'border-white shadow'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
