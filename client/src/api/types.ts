export interface TeamMember {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceConfig {
  days_of_week?: number[];
  day_of_month?: number;
  interval_days?: number;
}

export interface Chore {
  id: number;
  title: string;
  description: string;
  recurrence_type: RecurrenceType;
  recurrence_config: string;
  active: number;
  created_at: string;
  default_assignee: number | null;
  target_date: string | null;
}

export type OccurrenceStatus = 'pending' | 'completed' | 'overdue';

export interface ChoreOccurrence {
  id: number;
  chore_id: number;
  chore_title: string;
  chore_description: string;
  due_date: string;
  assigned_to: number | null;
  assigned_name: string | null;
  status: OccurrenceStatus;
  completed_at: string | null;
  completed_by: number | null;
  completed_name: string | null;
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

export interface Settings {
  slack_webhook_url: string;
  teams_webhook_url: string;
}
