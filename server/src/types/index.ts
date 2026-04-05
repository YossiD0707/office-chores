export interface TeamMember {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceConfig {
  days_of_week?: number[]; // 0=Sun, 1=Mon ... 6=Sat
  day_of_month?: number;   // 1-31
  interval_days?: number;  // for custom
}

export interface Chore {
  id: number;
  title: string;
  description: string;
  recurrence_type: RecurrenceType;
  recurrence_config: string; // JSON string
  active: number;
  created_at: string;
  default_assignee: number | null;
  target_date: string | null; // YYYY-MM-DD, for one-time chores
}

export type OccurrenceStatus = 'pending' | 'completed' | 'overdue';

export interface ChoreOccurrence {
  id: number;
  chore_id: number;
  chore_title?: string;
  chore_description?: string;
  due_date: string; // YYYY-MM-DD
  assigned_to: number | null;
  assigned_name?: string;
  status: OccurrenceStatus;
  completed_at: string | null;
  completed_by: number | null;
  completed_name?: string;
}

export type NotificationType = 'due_tomorrow' | 'overdue' | 'completed';

export interface Notification {
  id: number;
  occurrence_id: number;
  type: NotificationType;
  message: string;
  read: number;
  created_at: string;
}
