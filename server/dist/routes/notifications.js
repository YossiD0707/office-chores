"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const notifications = await (0, database_1.query)('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
    res.json(notifications);
});
router.get('/unread-count', async (_req, res) => {
    const row = await (0, database_1.queryOne)('SELECT COUNT(*) as count FROM notifications WHERE read = 0');
    res.json({ count: row?.count ?? 0 });
});
router.put('/read-all', async (_req, res) => {
    await (0, database_1.run)('UPDATE notifications SET read = 1');
    res.status(204).send();
});
router.put('/:id/read', async (req, res) => {
    const { id } = req.params;
    await (0, database_1.run)('UPDATE notifications SET read = 1 WHERE id = ?', [Number(id)]);
    res.status(204).send();
});
exports.default = router;
