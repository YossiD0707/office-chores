"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const rows = await (0, database_1.query)('SELECT key, value FROM settings');
    const settings = {};
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json(settings);
});
router.put('/', async (req, res) => {
    const { slack_webhook_url, teams_webhook_url } = req.body;
    if (slack_webhook_url !== undefined) {
        await (0, database_1.run)('UPDATE settings SET value = ? WHERE key = ?', [slack_webhook_url, 'slack_webhook_url']);
    }
    if (teams_webhook_url !== undefined) {
        await (0, database_1.run)('UPDATE settings SET value = ? WHERE key = ?', [teams_webhook_url, 'teams_webhook_url']);
    }
    res.status(204).send();
});
exports.default = router;
