import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import emailRoutes from './routes/email.routes';
import { emailQueue } from './queues/email.queue';
import './queues/email.worker'; // This line boots up the worker in the background!

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up the visual queue dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

// Hook up routes
app.use('/admin/queues', serverAdapter.getRouter());
app.use('/api/emails', emailRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'ReachInbox Scheduler Backend is live!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Queue Dashboard is live at http://localhost:${PORT}/admin/queues`);
});