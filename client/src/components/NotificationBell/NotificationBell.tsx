import { useState } from 'react';
import type { Notification } from '../../api/types';
import { markNotificationRead, markAllRead } from '../../api';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Props {
  notifications: Notification[];
  unreadCount: number;
  onChanged: () => void;
}

const TYPE_ICON: Record<string, string> = {
  due_tomorrow: '📅',
  overdue: '⚠️',
  completed: '✅',
};

export default function NotificationBell({ notifications, unreadCount, onChanged }: Props) {
  const [open, setOpen] = useState(false);

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
    onChanged();
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    onChanged();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <ul className="max-h-80 overflow-y-auto divide-y">
              {notifications.length === 0 && (
                <li className="px-4 py-6 text-sm text-gray-400 text-center">No notifications</li>
              )}
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 ${n.read === 0 ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <span className="text-base flex-shrink-0">{TYPE_ICON[n.type] ?? '🔔'}</span>
                      <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                    </div>
                    {n.read === 0 && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-blue-500 flex-shrink-0 hover:underline"
                      >
                        Read
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-6">
                    {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
