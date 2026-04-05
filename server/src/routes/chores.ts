import { Router, Request, Response } from 'express';
import { query, queryOne, run } from '../db/database';
import { Chore } from '../types';
import { generateOccurrences } from '../services/scheduler';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const chores = await query<Chore>(
    'SELECT * FROM chores WHERE active = 1 ORDER BY created_at DESC'
  );
  res.json(chores);
});

router.post('/', async (req: Request, res: Response) => {
  const { title, description, recurrence_type, recurrence_config, default_assignee, target_date } = req.body as {
    title?: string;
    description?: string;
    recurrence_type?: string;
    recurrence_config?: object;
    default_assignee?: number | null;
    target_date?: string | null;
  };

  if (!title?.trim()) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const { lastInsertRowid } = await run(
    `INSERT INTO chores (title, description, recurrence_type, recurrence_config, default_assignee, target_date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      description?.trim() ?? '',
      recurrence_type ?? 'none',
      JSON.stringify(recurrence_config ?? {}),
      default_assignee ?? null,
      target_date ?? null,
    ]
  );

  const chore = await queryOne<Chore>(
    'SELECT * FROM chores WHERE id = ?',
    [Number(lastInsertRowid)]
  );

  await generateOccurrences();
  res.status(201).json(chore);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, recurrence_type, recurrence_config, default_assignee, target_date } = req.body as {
    title?: string;
    description?: string;
    recurrence_type?: string;
    recurrence_config?: object;
    default_assignee?: number | null;
    target_date?: string | null;
  };

  const existing = await queryOne<Chore>(
    'SELECT * FROM chores WHERE id = ? AND active = 1',
    [Number(id)]
  );
  if (!existing) {
    res.status(404).json({ error: 'Chore not found' });
    return;
  }

  await run(
    `UPDATE chores SET title = ?, description = ?, recurrence_type = ?, recurrence_config = ?, default_assignee = ?, target_date = ?
     WHERE id = ?`,
    [
      title?.trim() ?? existing.title,
      description?.trim() ?? existing.description,
      recurrence_type ?? existing.recurrence_type,
      JSON.stringify(recurrence_config ?? JSON.parse(existing.recurrence_config as string)),
      default_assignee !== undefined ? (default_assignee ?? null) : existing.default_assignee,
      target_date !== undefined ? (target_date ?? null) : existing.target_date,
      Number(id),
    ]
  );

  const updated = await queryOne<Chore>('SELECT * FROM chores WHERE id = ?', [Number(id)]);
  await generateOccurrences();
  res.json(updated);
});

router.delete('/', async (_req: Request, res: Response) => {
  await run('DELETE FROM chore_occurrences');
  await run('UPDATE chores SET active = 0');
  res.status(204).send();
});

router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await run('UPDATE chores SET active = 0 WHERE id = ?', [Number(id)]);
  res.status(204).send();
});

export default router;
