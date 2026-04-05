"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOccurrences = generateOccurrences;
exports.markOverdue = markOverdue;
exports.sendDayBeforeReminders = sendDayBeforeReminders;
exports.initScheduler = initScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const date_fns_1 = require("date-fns");
const database_1 = require("../db/database");
const webhooks_1 = require("./webhooks");
const LOOKAHEAD_DAYS = 60;
function generateDatesForChore(chore, from, to) {
    const config = JSON.parse(chore.recurrence_config || '{}');
    const dates = [];
    if (chore.recurrence_type === 'none')
        return dates;
    let cursor = new Date(from);
    while (!(0, date_fns_1.isBefore)(to, cursor)) {
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
                const choreCreated = (0, date_fns_1.parseISO)(chore.created_at.slice(0, 10));
                const diff = Math.round((cursor.getTime() - choreCreated.getTime()) / (1000 * 60 * 60 * 24));
                include = diff >= 0 && diff % (config.interval_days ?? 1) === 0;
                break;
            }
        }
        if (include) {
            dates.push((0, date_fns_1.format)(cursor, 'yyyy-MM-dd'));
        }
        cursor = (0, date_fns_1.addDays)(cursor, 1);
    }
    return dates;
}
async function generateOccurrences() {
    const chores = await (0, database_1.query)('SELECT * FROM chores WHERE active = 1');
    const today = (0, date_fns_1.startOfDay)(new Date());
    const end = (0, date_fns_1.addDays)(today, LOOKAHEAD_DAYS);
    for (const chore of chores) {
        // One-time chore with a target date: create exactly one occurrence
        if (chore.recurrence_type === 'none') {
            if (chore.target_date) {
                await (0, database_1.run)(`INSERT OR IGNORE INTO chore_occurrences (chore_id, due_date, assigned_to, status)
           VALUES (?, ?, ?, 'pending')`, [chore.id, chore.target_date, chore.default_assignee ?? null]);
            }
            continue;
        }
        const dates = generateDatesForChore(chore, today, end);
        for (const d of dates) {
            // INSERT OR IGNORE so existing occurrences (possibly already assigned) are not overwritten
            await (0, database_1.run)(`INSERT OR IGNORE INTO chore_occurrences (chore_id, due_date, assigned_to, status)
         VALUES (?, ?, ?, 'pending')`, [chore.id, d, chore.default_assignee ?? null]);
        }
    }
}
async function markOverdue() {
    const today = (0, date_fns_1.format)((0, date_fns_1.startOfDay)(new Date()), 'yyyy-MM-dd');
    const overdue = await (0, database_1.query)(`SELECT co.id, c.title, tm.name as assigned_name
     FROM chore_occurrences co
     JOIN chores c ON c.id = co.chore_id
     LEFT JOIN team_members tm ON tm.id = co.assigned_to
     WHERE co.status = 'pending' AND co.due_date < ?`, [today]);
    for (const occ of overdue) {
        await (0, database_1.run)("UPDATE chore_occurrences SET status = 'overdue' WHERE id = ?", [occ.id]);
        const assignee = occ.assigned_name ?? 'Unassigned';
        const msg = `⚠️ Overdue chore: "${occ.title}" (assigned to: ${assignee})`;
        await (0, database_1.run)("INSERT INTO notifications (occurrence_id, type, message) VALUES (?, 'overdue', ?)", [occ.id, msg]);
        void (0, webhooks_1.sendAll)(msg);
    }
}
async function sendDayBeforeReminders() {
    const tomorrow = (0, date_fns_1.format)((0, date_fns_1.addDays)((0, date_fns_1.startOfDay)(new Date()), 1), 'yyyy-MM-dd');
    const upcoming = await (0, database_1.query)(`SELECT co.id, c.title, tm.name as assigned_name
     FROM chore_occurrences co
     JOIN chores c ON c.id = co.chore_id
     LEFT JOIN team_members tm ON tm.id = co.assigned_to
     WHERE co.due_date = ? AND co.status = 'pending'`, [tomorrow]);
    for (const occ of upcoming) {
        const assignee = occ.assigned_name ?? 'Unassigned';
        const msg = `📅 Reminder: "${occ.title}" is due tomorrow (assigned to: ${assignee})`;
        await (0, database_1.run)("INSERT INTO notifications (occurrence_id, type, message) VALUES (?, 'due_tomorrow', ?)", [occ.id, msg]);
        void (0, webhooks_1.sendAll)(msg);
    }
}
function initScheduler() {
    // Generate occurrences + check overdue + send reminders daily at 7 AM
    node_cron_1.default.schedule('0 7 * * *', () => {
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
