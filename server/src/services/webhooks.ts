import axios from 'axios';
import { queryOne } from '../db/database';

async function getWebhookUrl(key: 'slack_webhook_url' | 'teams_webhook_url'): Promise<string> {
  const row = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? '';
}

export async function sendSlack(message: string): Promise<void> {
  const url = await getWebhookUrl('slack_webhook_url');
  if (!url) return;
  try {
    await axios.post(url, { text: message });
  } catch (err) {
    console.error('[Slack webhook error]', err);
  }
}

export async function sendTeams(message: string): Promise<void> {
  const url = await getWebhookUrl('teams_webhook_url');
  if (!url) return;
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
    await axios.post(url, payload);
  } catch (err) {
    console.error('[Teams webhook error]', err);
  }
}

export async function sendAll(message: string): Promise<void> {
  await Promise.allSettled([sendSlack(message), sendTeams(message)]);
}
