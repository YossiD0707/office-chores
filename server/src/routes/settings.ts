import { Router, Request, Response } from 'express';
import { query, run } from '../db/database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM settings');
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put('/', async (req: Request, res: Response) => {
  const { slack_webhook_url, teams_webhook_url } = req.body as {
    slack_webhook_url?: string;
    teams_webhook_url?: string;
  };

  if (slack_webhook_url !== undefined) {
    await run('UPDATE settings SET value = ? WHERE key = ?', [slack_webhook_url, 'slack_webhook_url']);
  }
  if (teams_webhook_url !== undefined) {
    await run('UPDATE settings SET value = ? WHERE key = ?', [teams_webhook_url, 'teams_webhook_url']);
  }

  res.status(204).send();
});

export default router;
