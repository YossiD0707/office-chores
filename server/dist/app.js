"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const teamMembers_1 = __importDefault(require("./routes/teamMembers"));
const chores_1 = __importDefault(require("./routes/chores"));
const occurrences_1 = __importDefault(require("./routes/occurrences"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const settings_1 = __importDefault(require("./routes/settings"));
const scheduler_1 = __importDefault(require("./routes/scheduler"));
const database_1 = require("./db/database");
const scheduler_2 = require("./services/scheduler");
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/team-members', teamMembers_1.default);
app.use('/api/chores', chores_1.default);
app.use('/api/occurrences', occurrences_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/scheduler', scheduler_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
async function start() {
    await (0, database_1.initDb)();
    (0, scheduler_2.initScheduler)();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
void start();
exports.default = app;
