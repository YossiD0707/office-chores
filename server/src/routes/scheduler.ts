import { Router, Request, Response } from 'express';
import { generateOccurrences, markOverdue, sendDayBeforeReminders } from '../services/scheduler';

const router = Router();

// Manual trigger endpoint for testing
router.post('/run', (_req: Request, res: Response) => {
  generateOccurrences();
  markOverdue();
  sendDayBeforeReminders();
  res.json({ message: 'Scheduler jobs triggered successfully' });
});

export default router;
