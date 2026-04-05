import { Router, Request, Response } from 'express';
import { query, queryOne, run } from '../db/database';
import { Notification } from '../types';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const notifications = await query<Notification>(
    'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
  );
  res.json(notifications);
});

router.get('/unread-count', async (_req: Request, res: Response) => {
  const row = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE read = 0'
  );
  res.json({ count: row?.count ?? 0 });
});

router.put('/read-all', async (_req: Request, res: Response) => {
  await run('UPDATE notifications SET read = 1');
  res.status(204).send();
});

router.put('/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params;
  await run('UPDATE notifications SET read = 1 WHERE id = ?', [Number(id)]);
  res.status(204).send();
});

export default router;
