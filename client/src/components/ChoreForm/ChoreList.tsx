
import type { Chore } from '../../api/types';
import { deleteChore } from '../../api';

interface Props {
  chores: Chore[];
  onEdit: (chore: Chore) => void;
  onChanged: () => void;
  onAdd: () => void;
  onDeleteAll: () => void;
}

const RECURRENCE_LABEL: Record<string, string> = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

export default function ChoreList({ chores, onEdit, onChanged, onAdd, onDeleteAll }: Props) {
  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete chore "${title}"? All future occurrences will be removed.`)) return;
    await deleteChore(id);
    onChanged();
  };

  return (
    <div className="w-64 bg-white border-r flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Chores</h2>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-blue-700"
        >
          + Add
        </button>
      </div>
      {chores.length > 0 && (
        <button
          onClick={onDeleteAll}
          className="w-full px-4 py-2 text-xs text-red-500 hover:bg-red-50 border-b text-left"
        >
          Remove all chores
        </button>
      )}
      <ul className="flex-1 overflow-y-auto divide-y">
        {chores.length === 0 && (
          <li className="p-4 text-xs text-gray-400">No chores yet.</li>
        )}
        {chores.map((chore) => (
          <li key={chore.id} className="p-3 hover:bg-gray-50 group">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{chore.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{RECURRENCE_LABEL[chore.recurrence_type] ?? chore.recurrence_type}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(chore)}
                  className="text-blue-500 hover:text-blue-700 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(chore.id, chore.title)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Del
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
