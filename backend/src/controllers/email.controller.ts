import { Request, Response } from 'express';
import { pool } from '../config/prisma';
import { emailQueue } from '../queues/email.queue';

export class EmailController {
  static async scheduleBatch(req: Request, res: Response) {
    try {
      const userId = 'dummy-user-id';
      const { senderEmail, leads, subject, body, startTime, delayBetweenSeconds, hourlyLimit } = req.body;

      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: 'No leads provided' });
      }

      // 1. Ensure a dummy user exists
      let userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', ['test@reachinbox.ai']);
      let dbUserId = userId;
      if (userRes.rows.length === 0) {
        await pool.query(
          'INSERT INTO "User" (id, email, "googleId") VALUES ($1, $2, $3)',
          [userId, 'test@reachinbox.ai', 'test-google-id']
        );
      } else {
        dbUserId = userRes.rows[0].id;
      }

      // 2. Resolve or create Sender Configuration
      let senderRes = await pool.query('SELECT id FROM "SenderConfig" WHERE "senderEmail" = $1', [senderEmail]);
      let senderConfigId: string;
      if (senderRes.rows.length === 0) {
        const newSender = await pool.query(
          'INSERT INTO "SenderConfig" (id, "userId", "senderEmail", "hourlyLimit") VALUES (gen_random_uuid(), $1, $2, $3) RETURNING id',
          [dbUserId, senderEmail, hourlyLimit || 200]
        );
        senderConfigId = newSender.rows[0].id;
      } else {
        senderConfigId = senderRes.rows[0].id;
      }

      const initialStart = startTime ? new Date(startTime).getTime() : Date.now();
      const delayStepMs = (delayBetweenSeconds || 2) * 1000;
      let scheduledCount = 0;

      // 3. Process each lead
      for (let i = 0; i < leads.length; i++) {
        const recipientEmail = leads[i];
        const targetExecutionTime = new Date(initialStart + (i * delayStepMs));
        const computedDelayMs = Math.max(0, targetExecutionTime.getTime() - Date.now());

        // Create Database Record using raw SQL
        const emailRecord = await pool.query(
          `INSERT INTO "EmailJob" (id, "userId", "senderConfigId", "recipientEmail", subject, body, "scheduledFor", status, "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW()) RETURNING id`,
          [dbUserId, senderConfigId, recipientEmail, subject, body, targetExecutionTime]
        );
        const emailJobId = emailRecord.rows[0].id;

        // Add to Redis Queue with calculated delay
        const job = await emailQueue.add(
          'send-email',
          { emailJobId },
          { delay: computedDelayMs, jobId: `email_${emailJobId}` }
        );

        // Update with BullMQ Job ID
        await pool.query('UPDATE "EmailJob" SET "bullmqJobId" = $1 WHERE id = $2', [job.id, emailJobId]);

        scheduledCount++;
      }

      return res.status(201).json({ message: `Successfully scheduled ${scheduledCount} emails.` });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Scheduling failed' });
    }
  }

  static async getScheduled(req: Request, res: Response) {
    const emails = await pool.query(
      'SELECT * FROM "EmailJob" WHERE status = ANY(ARRAY[\'PENDING\', \'RATE_LIMITED\', \'PROCESSING\']) ORDER BY "scheduledFor" ASC'
    );
    return res.json(emails.rows);
  }

  static async getSent(req: Request, res: Response) {
    const emails = await pool.query(
      'SELECT * FROM "EmailJob" WHERE status = ANY(ARRAY[\'SENT\', \'FAILED\']) ORDER BY "sentAt" DESC'
    );
    return res.json(emails.rows);
  }
}