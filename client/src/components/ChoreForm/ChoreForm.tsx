import { useState } from 'react';
import type { Chore, RecurrenceType, RecurrenceConfig, TeamMember } from '../../api/types';
import { createChore, updateChore } from '../../api';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  existing?: Chore;
  members: TeamMember[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ChoreForm({ existing, members, onClose, onSaved }: Props) {
  const existingConfig: RecurrenceConfig = existing
    ? JSON.parse(existing.recurrence_config)
    : {};

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    existing?.recurrence_type ?? 'none'
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existingConfig.days_of_week ?? []);
  const [dayOfMonth, setDayOfMonth] = useState<number>(existingConfig.day_of_month ?? 1);
  const [intervalDays, setIntervalDays] = useState<number>(existingConfig.interval_days ?? 2);
  const [defaultAssignee, setDefaultAssignee] = useState<number | ''>(existing?.default_assignee ?? '');
  const [targetDate, setTargetDate] = useState(existing?.target_date ?? todayStr());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buildConfig = (): RecurrenceConfig => {
    switch (recurrenceType) {
      case 'weekly': return { days_of_week: daysOfWeek };
      case 'monthly': return { day_of_month: dayOfMonth };
      case 'custom': return { interval_days: intervalDays };
      default: return {};
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (recurrenceType === 'weekly' && daysOfWeek.length === 0) {
      setError('Select at least one day of the week');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        recurrence_type: recurrenceType,
        recurrence_config: buildConfig(),
        default_assignee: defaultAssignee === '' ? null : defaultAssignee,
        target_date: recurrenceType === 'none' ? targetDate : null,
      };
      if (existing) {
        await updateChore(existing.id, data);
      } else {
        await createChore(data);
      }
      onSaved();
    } catch {
      setError('Failed to save chore.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (d: number) =>
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{existing ? 'Edit Chore' : 'New Chore'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Clean the kitchen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recurrence</label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">One-time (no recurrence)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom interval</option>
            </select>
          </div>

          {recurrenceType === 'weekly' && (
            <div>
              <label className="block text-sm font-medium mb-2">Days of week</label>
              <div className="flex gap-2">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                      daysOfWeek.includes(i)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType === 'monthly' && (
            <div>
              <label className="block text-sm font-medium mb-1">Day of month</label>
              <input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {recurrenceType === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-1">Every N days</label>
              <input
                type="number"
                min={1}
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value))}
                className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {recurrenceType === 'none' && (
            <div>
              <label className="block text-sm font-medium mb-1">Target date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Assign to</label>
            <select
              value={defaultAssignee}
              onChange={(e) => setDefaultAssignee(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {recurrenceType === 'none' ? 'Assigned to this person.' : 'New occurrences will be pre-assigned to this person.'}
            </p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : existing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
