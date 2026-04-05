"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
const PALETTE = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
router.get('/', async (_req, res) => {
    const members = await (0, database_1.query)('SELECT * FROM team_members ORDER BY name');
    res.json(members);
});
router.post('/', async (req, res) => {
    const { name } = req.body;
    if (!name?.trim()) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    const existing = await (0, database_1.query)('SELECT id FROM team_members');
    const color = PALETTE[existing.length % PALETTE.length];
    const { lastInsertRowid } = await (0, database_1.run)('INSERT INTO team_members (name, color) VALUES (?, ?)', [name.trim(), color]);
    const member = await (0, database_1.queryOne)('SELECT * FROM team_members WHERE id = ?', [Number(lastInsertRowid)]);
    res.status(201).json(member);
});
router.patch('/:id/color', async (req, res) => {
    const { id } = req.params;
    const { color } = req.body;
    if (!color) {
        res.status(400).json({ error: 'Color is required' });
        return;
    }
    await (0, database_1.run)('UPDATE team_members SET color = ? WHERE id = ?', [color, Number(id)]);
    const member = await (0, database_1.queryOne)('SELECT * FROM team_members WHERE id = ?', [Number(id)]);
    res.json(member);
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    await (0, database_1.run)('DELETE FROM team_members WHERE id = ?', [Number(id)]);
    res.status(204).send();
});
exports.default = router;
