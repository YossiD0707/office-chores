import axios from 'axios';
import type {
  TeamMember,
  Chore,
  ChoreOccurrence,
  Notification,
  Settings,
  RecurrenceType,
  RecurrenceConfig,
} from './types';

const api = axios.create({ baseURL: '/api' });// Team Members
export const getTeamMembers = () =>
  api.get<TeamMember[]>('/team-members').then((r) => r.data);

export const createTeamMember = (name: string) =>
  api.post<TeamMember>('/team-members', { name }).then((r) => r.data);

export const updateTeamMemberColor = (id: number, color: string) =>
  api.patch<TeamMember>(`/team-members/${id}/color`, { color }).then((r) => r.data);

export const deleteTeamMember = (id: number) =>
  api.delete(`/team-members/${id}`);

// Chores
export const getChores = () =>
  api.get<Chore[]>('/chores').then((r) => r.data);

export const createChore = (data: {
  title: string;
  description: string;
  recurrence_type: RecurrenceType;
  recurrence_config: RecurrenceConfig;
  default_assignee?: number | null;
  target_date?: string | null;
}) => api.post<Chore>('/chores', data).then((r) => r.data);

export const updateChore = (
  id: number,
  data: {
    title?: string;
    description?: string;
    recurrence_type?: RecurrenceType;
    recurrence_config?: RecurrenceConfig;
    default_assignee?: number | null;
    target_date?: string | null;
  }
) => api.put<Chore>(`/chores/${id}`, data).then((r) => r.data);

export const deleteChore = (id: number) => api.delete(`/chores/${id}`);

export const deleteAllChores = () => api.delete('/chores');

// Occurrences
export const getOccurrences = (from?: string, to?: string) => {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return api.get<ChoreOccurrence[]>('/occurrences', { params }).then((r) => r.data);
};

export const assignOccurrence = (id: number, assigned_to: number | null) =>
  api.put<ChoreOccurrence>(`/occurrences/${id}/assign`, { assigned_to }).then((r) => r.data);

export const completeOccurrence = (id: number, completed_by: number) =>
  api.put<ChoreOccurrence>(`/occurrences/${id}/complete`, { completed_by }).then((r) => r.data);

// Notifications
export const getNotifications = () =>
  api.get<Notification[]>('/notifications').then((r) => r.data);

export const getUnreadCount = () =>
  api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count);

export const markNotificationRead = (id: number) =>
  api.put(`/notifications/${id}/read`);

export const markAllRead = () => api.put('/notifications/read-all');

// Settings
export const getSettings = () =>
  api.get<Settings>('/settings').then((r) => r.data);

export const updateSettings = (data: Partial<Settings>) =>
  api.put('/settings', data);

// Manual scheduler trigger
export const runScheduler = () =>
  api.post('/scheduler/run').then((r) => r.data);
