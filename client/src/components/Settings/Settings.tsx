import { useEffect, useState } from 'react';
import type { Settings } from '../../api/types';
import { getSettings, updateSettings, runScheduler } from '../../api';

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const [settings, setSettings] = useState<Settings>({ slack_webhook_url: '', teams_webhook_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateSettings(settings);
      setMessage('Settings saved.');
    } catch {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRunScheduler = async () => {
    try {
      await runScheduler();
      setMessage('Scheduler jobs triggered successfully.');
    } catch {
      setMessage('Failed to run scheduler.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Slack Webhook URL</label>
              <input
                type="url"
                value={settings.slack_webhook_url}
                onChange={(e) => setSettings((s) => ({ ...s, slack_webhook_url: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Microsoft Teams Webhook URL</label>
              <input
                type="url"
                value={settings.teams_webhook_url}
                onChange={(e) => setSettings((s) => ({ ...s, teams_webhook_url: e.target.value }))}
                placeholder="https://outlook.office.com/webhook/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {message && (
          <p className={`text-sm mt-3 ${message.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={handleRunScheduler}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Trigger scheduler now
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
