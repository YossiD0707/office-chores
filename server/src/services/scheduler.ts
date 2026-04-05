import cron from 'node-cron';
import { addDays, format, parseISO, isBefore, startOfDay } from 'date-fns';
import { query, run } from '../db/database';
import { sendAll } from './webhooks';
import { Chore, RecurrenceConfig } from '../types';

const LOOKAHEAD_DAYS = 60;

function generateDatesForChore(chore: Chore, from: Date, to: Date): string[] {
  const config: RecurrenceConfig = JSON.parse(chore.recurrence_config as string || '{}');
  const dates: string[] = [];

  if (chore.recurrence_type === 'none') return dates;

  let cursor = new Date(from);
  while (!isBefore(to, cursor)) {
    let include = false;

    switch (chore.recurrence_type) {
      case 'daily':
        include = true;
        break;
      case 'weekly':
        include = (config.days_of_week ?? []).includes(cursor.getDay());
        break;
      case 'monthly':
        include = cursor.getDate() === (config.day_of_month ?? 1);
        break;
      case 'custom': {
        const choreCreated = parseISO((chore.created_at as string).slice(0, 10));
        const diff = Math.round(
          (cursor.getTime() - choreCreated.getTime()) / (1000 * 60 * 60 * 24)
        );
        include = diff >= 0 && diff % (config.interval_days ?? 1) === 0;
        break;
      }
    }

    if (include) {
      dates.push(format(cursor, 'yyyy-MM-dd'));
    }
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export async function generateOccurrences(): Promise<void> {
  const chores = await query<Chore>('SELECT * FROM chores WHERE active = 1');

  const today = startOfDay(new Date());
  const end = addDays(today, LOOKAHEAD_DAYS);

  for (const chore of chores) {
    // One-time chore with a target date: create exactly one occurrence
    if (chore.recurrence_type === 'none') {
      if (chore.target_date) {
        await run(
          `INSERT OR IGNORE INTO chore_occurrences (chore_id, due_date, assigned_to, status)
           VALUES (?, ?, ?, 'pending')`,
          [chore.id, chore.target_date, chore.default_assignee ?? null]
        );
      }
      continue;
    }

    const dates = generateDatesForChore(chore, today, end);
    for (const d of dates) {
      // INSERT OR IGNORE so existing occurrences (possibly already assigned) are not overwritten
      await run(
        `INSERT OR IGNORE INTO chore_occurrences (chore_id, due_date, assigned_to, status)
         VALUES (?, ?, ?, 'pending')`,
        [chore.id, d, chore.default_assignee ?? null]
      );
    }
  }
}

export async function markOverdue(): Promise<void> {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const overdue = await query<{ id: number; title: string; assigned_name: string | null }>(
    `SELECT co.id, c.title, tm.name as assigned_name
     FROM chore_occurrences co
     JOIN chores c ON c.id = co.chore_id
     LEFT JOIN team_members tm ON tm.id = co.assigned_to
     WHERE co.status = 'pending' AND co.due_date < ?`,
    [today]
  );

  for (const occ of overdue) {
    await run("UPDATE chore_occurrences SET status = 'overdue' WHERE id = ?", [occ.id]);
    const assignee = occ.assigned_name ?? 'Unassigned';
    const msg = `⚠️ Overdue chore: "${occ.title}" (assigned to: ${assignee})`;
    await run(
      "INSERT INTO notifications (occurrence_id, type, message) VALUES (?, 'overdue', ?)",
      [occ.id, msg]
    );
    void sendAll(msg);
  }
}

export async function sendDayBeforeReminders(): Promise<void> {
  const tomorrow = format(addDays(startOfDay(new Date()), 1), 'yyyy-MM-dd');

  const upcoming = await query<{ id: number; title: string; assigned_name: string | null }>(
    `SELECT co.id, c.title, tm.name as assigned_name
     FROM chore_occurrences co
     JOIN chores c ON c.id = co.chore_id
     LEFT JOIN team_members tm ON tm.id = co.assigned_to
     WHERE co.due_date = ? AND co.status = 'pending'`,
    [tomorrow]
  );

  for (const occ of upcoming) {
    const assignee = occ.assigned_name ?? 'Unassigned';
    const msg = `📅 Reminder: "${occ.title}" is due tomorrow (assigned to: ${assignee})`;
    await run(
      "INSERT INTO notifications (occurrence_id, type, message) VALUES (?, 'due_tomorrow', ?)",
      [occ.id, msg]
    );
    void sendAll(msg);
  }
}

export function initScheduler(): void {
  // Generate occurrences + check overdue + send reminders daily at 7 AM
  cron.schedule('0 7 * * *', () => {
    console.log('[Scheduler] Running daily jobs...');
    void generateOccurrences();
    void markOverdue();
    void sendDayBeforeReminders();
  });

  // Run once on startup
  void generateOccurrences();
  void markOverdue();
  console.log('[Scheduler] Initialized.');
}
