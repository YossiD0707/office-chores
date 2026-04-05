import { Router, Request, Response } from 'express';
import { query, queryOne, run } from '../db/database';
import { TeamMember } from '../types';

const router = Router();

const PALETTE = ['#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

router.get('/', async (_req: Request, res: Response) => {
  const members = await query<TeamMember>('SELECT * FROM team_members ORDER BY name');
  res.json(members);
});

router.post('/', async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  const existing = await query<TeamMember>('SELECT id FROM team_members');
  const color = PALETTE[existing.length % PALETTE.length];
  const { lastInsertRowid } = await run(
    'INSERT INTO team_members (name, color) VALUES (?, ?)',
    [name.trim(), color]
  );
  const member = await queryOne<TeamMember>(
    'SELECT * FROM team_members WHERE id = ?',
    [Number(lastInsertRowid)]
  );
  res.status(201).json(member);
});

router.patch('/:id/color', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { color } = req.body as { color?: string };
  if (!color) {
    res.status(400).json({ error: 'Color is required' });
    return;
  }
  await run('UPDATE team_members SET color = ? WHERE id = ?', [color, Number(id)]);
  const member = await queryOne<TeamMember>('SELECT * FROM team_members WHERE id = ?', [Number(id)]);
  res.json(member);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await run('DELETE FROM team_members WHERE id = ?', [Number(id)]);
  res.status(204).send();
});

export default router;
