"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSlack = sendSlack;
exports.sendTeams = sendTeams;
exports.sendAll = sendAll;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../db/database");
async function getWebhookUrl(key) {
    const row = await (0, database_1.queryOne)('SELECT value FROM settings WHERE key = ?', [key]);
    return row?.value ?? '';
}
async function sendSlack(message) {
    const url = await getWebhookUrl('slack_webhook_url');
    if (!url)
        return;
    try {
        await axios_1.default.post(url, { text: message });
    }
    catch (err) {
        console.error('[Slack webhook error]', err);
    }
}
async function sendTeams(message) {
    const url = await getWebhookUrl('teams_webhook_url');
    if (!url)
        return;
    try {
        const payload = {
            type: 'message',
            attachments: [
                {
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: {
                        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                        type: 'AdaptiveCard',
                        version: '1.2',
                        body: [{ type: 'TextBlock', text: message, wrap: true }],
                    },
                },
            ],
        };
        await axios_1.default.post(url, payload);
    }
    catch (err) {
        console.error('[Teams webhook error]', err);
    }
}
async function sendAll(message) {
    await Promise.allSettled([sendSlack(message), sendTeams(message)]);
}
