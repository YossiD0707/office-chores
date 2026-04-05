import express from 'express';
import cors from 'cors';
import teamMembersRouter from './routes/teamMembers';
import choresRouter from './routes/chores';
import occurrencesRouter from './routes/occurrences';
import notificationsRouter from './routes/notifications';
import settingsRouter from './routes/settings';
import schedulerRouter from './routes/scheduler';
import { initDb } from './db/database';
import { initScheduler } from './services/scheduler';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/team-members', teamMembersRouter);
app.use('/api/chores', choresRouter);
app.use('/api/occurrences', occurrencesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/scheduler', schedulerRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

async function start() {
  await initDb();
  initScheduler();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

void start();

export default app;
