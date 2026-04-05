"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const scheduler_1 = require("../services/scheduler");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const chores = await (0, database_1.query)('SELECT * FROM chores WHERE active = 1 ORDER BY created_at DESC');
    res.json(chores);
});
router.post('/', async (req, res) => {
    const { title, description, recurrence_type, recurrence_config, default_assignee, target_date } = req.body;
    if (!title?.trim()) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }
    const { lastInsertRowid } = await (0, database_1.run)(`INSERT INTO chores (title, description, recurrence_type, recurrence_config, default_assignee, target_date)
     VALUES (?, ?, ?, ?, ?, ?)`, [
        title.trim(),
        description?.trim() ?? '',
        recurrence_type ?? 'none',
        JSON.stringify(recurrence_config ?? {}),
        default_assignee ?? null,
        target_date ?? null,
    ]);
    const chore = await (0, database_1.queryOne)('SELECT * FROM chores WHERE id = ?', [Number(lastInsertRowid)]);
    await (0, scheduler_1.generateOccurrences)();
    res.status(201).json(chore);
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, recurrence_type, recurrence_config, default_assignee, target_date } = req.body;
    const existing = await (0, database_1.queryOne)('SELECT * FROM chores WHERE id = ? AND active = 1', [Number(id)]);
    if (!existing) {
        res.status(404).json({ error: 'Chore not found' });
        return;
    }
    await (0, database_1.run)(`UPDATE chores SET title = ?, description = ?, recurrence_type = ?, recurrence_config = ?, default_assignee = ?, target_date = ?
     WHERE id = ?`, [
        title?.trim() ?? existing.title,
        description?.trim() ?? existing.description,
        recurrence_type ?? existing.recurrence_type,
        JSON.stringify(recurrence_config ?? JSON.parse(existing.recurrence_config)),
        default_assignee !== undefined ? (default_assignee ?? null) : existing.default_assignee,
        target_date !== undefined ? (target_date ?? null) : existing.target_date,
        Number(id),
    ]);
    const updated = await (0, database_1.queryOne)('SELECT * FROM chores WHERE id = ?', [Number(id)]);
    await (0, scheduler_1.generateOccurrences)();
    res.json(updated);
});
router.delete('/', async (_req, res) => {
    await (0, database_1.run)('DELETE FROM chore_occurrences');
    await (0, database_1.run)('UPDATE chores SET active = 0');
    res.status(204).send();
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await (0, database_1.run)('UPDATE chores SET active = 0 WHERE id = ?', [Number(id)]);
    res.status(204).send();
});
exports.default = router;
