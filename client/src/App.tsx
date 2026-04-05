import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import type { Chore, ChoreOccurrence, TeamMember, Notification } from './api/types';
import {
  getChores,
  getOccurrences,
  getTeamMembers,
  getNotifications,
  getUnreadCount,
  deleteAllChores,
} from './api';
import ChoreCalendar from './components/Calendar/ChoreCalendar';
import ChoreList from './components/ChoreForm/ChoreList';
import ChoreForm from './components/ChoreForm/ChoreForm';
import OccurrenceModal from './components/OccurrenceModal/OccurrenceModal';
import TeamPanel from './components/TeamPanel/TeamPanel';
import NotificationBell from './components/NotificationBell/NotificationBell';
import SettingsPanel from './components/Settings/Settings';

export default function App() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [occurrences, setOccurrences] = useState<ChoreOccurrence[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal state
  const [showChoreForm, setShowChoreForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | undefined>();
  const [selectedOccurrence, setSelectedOccurrence] = useState<ChoreOccurrence | undefined>();
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const MEMBER_PALETTE = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
  const memberColors = useMemo<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    members.forEach((m, i) => { map[m.id] = m.color || MEMBER_PALETTE[i % MEMBER_PALETTE.length]; });
    return map;
  }, [members]);

  const notifIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const loadChores = useCallback(async () => {
    const data = await getChores();
    setChores(data);
  }, []);

  const loadOccurrences = useCallback(async (date: Date) => {
    const from = format(subMonths(startOfMonth(date), 1), 'yyyy-MM-dd');
    const to = format(addMonths(endOfMonth(date), 1), 'yyyy-MM-dd');
    const data = await getOccurrences(from, to);
    setOccurrences(data);
  }, []);

  const loadMembers = useCallback(async () => {
    const data = await getTeamMembers();
    setMembers(data);
  }, []);

  const loadNotifications = useCallback(async () => {
    const [notifs, count] = await Promise.all([getNotifications(), getUnreadCount()]);
    setNotifications(notifs);
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    void loadChores();
    void loadMembers();
    void loadNotifications();
  }, [loadChores, loadMembers, loadNotifications]);

  useEffect(() => {
    void loadOccurrences(currentDate);
  }, [currentDate, loadOccurrences]);

  // Poll notifications every 60 seconds
  useEffect(() => {
    notifIntervalRef.current = setInterval(() => {
      void loadNotifications();
    }, 60_000);
    return () => clearInterval(notifIntervalRef.current);
  }, [loadNotifications]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadChores(), loadOccurrences(currentDate), loadNotifications()]);
  }, [loadChores, loadOccurrences, loadNotifications, currentDate]);

  const handleOccurrenceUpdated = useCallback(async () => {
    setSelectedOccurrence(undefined);
    await refreshAll();
  }, [refreshAll]);

  const handleDeleteAll = useCallback(async () => {
    if (!confirm('Remove ALL chores and their occurrences? This cannot be undone.')) return;
    await deleteAllChores();
    await refreshAll();
  }, [refreshAll]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧹</span>
          <h1 className="text-lg font-bold text-gray-800">Office Chores</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTeamPanel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Team
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onChanged={loadNotifications}
          />
        </div>
      </header>

      {/* Legend */}
      <div className="bg-white border-b px-6 py-2 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-400 inline-block"></span>Unassigned</span>
        {members.map((m) => (
          <span key={m.id} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: memberColors[m.id] }}></span>
            {m.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span>Overdue</span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <ChoreList
          chores={chores}
          onAdd={() => { setEditingChore(undefined); setShowChoreForm(true); }}
          onEdit={(chore) => { setEditingChore(chore); setShowChoreForm(true); }}
          onChanged={refreshAll}
          onDeleteAll={handleDeleteAll}
        />

        <main className="flex-1 p-4 overflow-hidden">
          <ChoreCalendar
            occurrences={occurrences}
            memberColors={memberColors}
            onSelectOccurrence={setSelectedOccurrence}
            onNavigate={setCurrentDate}
          />
        </main>
      </div>

      {/* Modals */}
      {showChoreForm && (
        <ChoreForm
          existing={editingChore}
          members={members}
          onClose={() => setShowChoreForm(false)}
          onSaved={() => { setShowChoreForm(false); void refreshAll(); }}
        />
      )}

      {selectedOccurrence && (
        <OccurrenceModal
          occurrence={selectedOccurrence}
          members={members}
          onClose={() => setSelectedOccurrence(undefined)}
          onUpdated={handleOccurrenceUpdated}
        />
      )}

      {showTeamPanel && (
        <TeamPanel
          members={members}
          onClose={() => setShowTeamPanel(false)}
          onChanged={loadMembers}
        />
      )}

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
