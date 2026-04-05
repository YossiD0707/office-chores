"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const date_fns_1 = require("date-fns");
const database_1 = require("../db/database");
const webhooks_1 = require("../services/webhooks");
const router = (0, express_1.Router)();
const OCCURRENCE_QUERY = `
  SELECT
    co.id, co.chore_id, co.due_date, co.assigned_to, co.status,
    co.completed_at, co.completed_by,
    c.title as chore_title, c.description as chore_description,
    tm.name as assigned_name,
    tm2.name as completed_name
  FROM chore_occurrences co
  JOIN chores c ON c.id = co.chore_id
  LEFT JOIN team_members tm ON tm.id = co.assigned_to
  LEFT JOIN team_members tm2 ON tm2.id = co.completed_by
`;
router.get('/', async (req, res) => {
    const { from, to } = req.query;
    let sql = OCCURRENCE_QUERY;
    const args = [];
    if (from && to) {
        sql += ' WHERE co.due_date BETWEEN ? AND ?';
        args.push(from, to);
    }
    else if (from) {
        sql += ' WHERE co.due_date >= ?';
        args.push(from);
    }
    else if (to) {
        sql += ' WHERE co.due_date <= ?';
        args.push(to);
    }
    sql += ' ORDER BY co.due_date';
    const occurrences = await (0, database_1.query)(sql, args);
    res.json(occurrences);
});
router.put('/:id/assign', async (req, res) => {
    const { id } = req.params;
    const { assigned_to } = req.body;
    const occ = await (0, database_1.queryOne)(OCCURRENCE_QUERY + ' WHERE co.id = ?', [Number(id)]);
    if (!occ) {
        res.status(404).json({ error: 'Occurrence not found' });
        return;
    }
    await (0, database_1.run)('UPDATE chore_occurrences SET assigned_to = ? WHERE id = ?', [
        assigned_to ?? null,
        Number(id),
    ]);
    const updated = await (0, database_1.queryOne)(OCCURRENCE_QUERY + ' WHERE co.id = ?', [Number(id)]);
    res.json(updated);
});
router.put('/:id/complete', async (req, res) => {
    const { id } = req.params;
    const { completed_by } = req.body;
    const occ = await (0, database_1.queryOne)(OCCURRENCE_QUERY + ' WHERE co.id = ?', [Number(id)]);
    if (!occ) {
        res.status(404).json({ error: 'Occurrence not found' });
        return;
    }
    if (occ.assigned_to === null) {
        res.status(400).json({ error: 'Cannot complete an unassigned chore' });
        return;
    }
    if (Number(occ.assigned_to) !== Number(completed_by)) {
        res.status(403).json({ error: 'Only the assigned team member can complete this chore' });
        return;
    }
    const completedAt = (0, date_fns_1.format)(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    await (0, database_1.run)(`UPDATE chore_occurrences
     SET status = 'completed', completed_at = ?, completed_by = ?
     WHERE id = ?`, [completedAt, completed_by, Number(id)]);
    const updated = await (0, database_1.queryOne)(OCCURRENCE_QUERY + ' WHERE co.id = ?', [Number(id)]);
    if (!updated) {
        res.status(500).json({ error: 'Failed to fetch updated occurrence' });
        return;
    }
    const msg = `✅ "${updated.chore_title}" was completed by ${updated.completed_name ?? 'Unknown'} on ${updated.due_date}`;
    await (0, database_1.run)(`INSERT INTO notifications (occurrence_id, type, message) VALUES (?, 'completed', ?)`, [Number(id), msg]);
    void (0, webhooks_1.sendAll)(msg);
    res.json(updated);
});
exports.default = router;
