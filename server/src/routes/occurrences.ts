import { Router, Request, Response } from 'express';
import { format } from 'date-fns';
import { query, queryOne, run } from '../db/database';
import { ChoreOccurrence } from '../types';
import { sendAll } from '../services/webhooks';

const router = Router();

const OCCURRENCE_QUERY = `
  SELECT
    co.id, co.chore_id, co.due_date, co.assigned_to, co.status,
    co.completed_at, co.completed_by,
    c.title as chore_title, c.description as chore_description,
    tm.name as assigned_name,
    tm2.name as completed_name
  FROM chore_occurrences co
  JOIN chores c ON c.id = co.chore_id
  LEFT JOIN team_members tm ON tm.id = co.assigned_to
  LEFT JOIN team_members tm2 ON tm2.id = co.completed_by
`;

router.get('/', async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };

  let sql = OCCURRENCE_QUERY;
  const args: string[] = [];

  if (from && to) {
    sql += ' WHERE co.due_date BETWEEN ? AND ?';
    args.push(from, to);
  } else if (from) {
    sql += ' WHERE co.due_date >= ?';
    args.push(from);
  } else if (to) {
    sql += ' WHERE co.due_date <= ?';
    args.push(to);
  }

  sql += ' ORDER BY co.due_date';

  const occurrences = await query<ChoreOccurrence>(sql, args);
  res.json(occurrences);
});

router.put('/:id/assign', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assigned_to } = req.body as { assigned_to: number | null };

  const occ = await queryOne<ChoreOccurrence>(
    OCCURRENCE_QUERY + ' WHERE co.id = ?',
    [Number(id)]
  );

  if (!occ) {
    res.status(404).json({ error: 'Occurrence not found' });
    return;
  }

  await run('UPDATE chore_occurrences SET assigned_to = ? WHERE id = ?', [
    assigned_to ?? null,
    Number(id),
  ]);

  const updated = await queryOne<ChoreOccurrence>(
    OCCURRENCE_QUERY + ' WHERE co.id = ?',
    [Number(id)]
  );

  res.json(updated);
});

router.put('/:id/complete', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { completed_by } = req.body as { completed_by: number };

  const occ = await queryOne<ChoreOccurrence>(
    OCCURRENCE_QUERY + ' WHERE co.id = ?',
    [Number(id)]
  );

  if (!occ) {
    res.status(404).json({ error: 'Occurrence not found' });
    return;
  }

  if (occ.assigned_to === null) {
    res.status(400).json({ error: 'Cannot complete an unassigned chore' });
    return;
  }

  if (Number(occ.assigned_to) !== Number(completed_by)) {
    res.status(403).json({ error: 'Only the assigned team member can complete this chore' });
    return;
  }

  const completedAt = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");

  await run(
    `UPDATE chore_occurrences
     SET status = 'completed', completed_at = ?, completed_by = ?
     WHERE id = ?`,
    [completedAt, completed_by, Number(id)]
  );

  const updated = await queryOne<ChoreOccurrence>(
    OCCURRENCE_QUERY + ' WHERE co.id = ?',
    [Number(id)]
  );

  if (!updated) {
    res.status(500).json({ error: 'Failed to fetch updated occurrence' });
    return;
  }

  const msg = `✅ "${updated.chore_title}" was completed by ${updated.completed_name ?? 'Unknown'} on ${updated.due_date}`;
  await run(
    `INSERT INTO notifications (occurrence_id, type, message) VALUES (?, 'completed', ?)`,
    [Number(id), msg]
  );

  void sendAll(msg);

  res.json(updated);
});

export default router;
