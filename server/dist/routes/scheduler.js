"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const scheduler_1 = require("../services/scheduler");
const router = (0, express_1.Router)();
// Manual trigger endpoint for testing
router.post('/run', (_req, res) => {
    (0, scheduler_1.generateOccurrences)();
    (0, scheduler_1.markOverdue)();
    (0, scheduler_1.sendDayBeforeReminders)();
    res.json({ message: 'Scheduler jobs triggered successfully' });
});
exports.default = router;
