import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { emailQueue } from './queues/email.queue';
import { EmailController } from './controllers/email.controller';
import authRouter from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Bull-Board Setup for Queue Monitoring
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// API Routes
app.use('/api/auth', authRouter);
app.post('/api/emails/schedule', EmailController.scheduleBatch);
app.get('/api/emails/scheduled', EmailController.getScheduled);
app.get('/api/emails/sent', EmailController.getSent);

app.get('/', (req, res) => {
  res.send('ReachInbox Scheduler Backend is running successfully.');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Bull-Board monitoring available at http://localhost:${PORT}/admin/queues`);
});