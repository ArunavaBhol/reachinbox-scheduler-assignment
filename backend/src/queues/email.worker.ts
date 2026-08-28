import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { pool } from '../config/prisma';
import { MailerService } from '../services/mailer.service';

const MIN_DELAY_MS = 2000;

function getMsUntilNextHour(): number {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
}

export const emailWorker = new Worker(
  'EmailJobSchedulerQueue',
  async (job: Job) => {
    const { emailJobId } = job.data;

    // 1. Fetch job details using raw SQL with Joins
    const jobRes = await pool.query(
      `SELECT e.*, 
              s."senderEmail", s."hourlyLimit" 
       FROM "EmailJob" e
       JOIN "SenderConfig" s ON e."senderConfigId" = s.id
       WHERE e.id = $1`,
      [emailJobId]
    );

    const emailRecord = jobRes.rows[0];

    if (!emailRecord || emailRecord.status === 'SENT') {
      return { skipped: true, reason: 'Already processed or not found' };
    }

    // 2. Redis Rate Limiting Check
    const now = new Date();
    const hourKey = `ratelimit:${emailRecord.senderEmail}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    
    const currentCount = await redisConnection.incr(hourKey);
    if (currentCount === 1) {
      await redisConnection.expire(hourKey, 7200); 
    }

    // 3. If hourly limit is hit, delay the job
    if (currentCount > emailRecord.hourlyLimit) {
      const delayMs = getMsUntilNextHour();
      
      await pool.query('UPDATE "EmailJob" SET status = $1 WHERE id = $2', ['RATE_LIMITED', emailRecord.id]);
      await job.moveToDelayed(Date.now() + delayMs, job.token);
      
      throw Worker.RateLimitError();
    }

    // 4. Update status to PROCESSING
    await pool.query('UPDATE "EmailJob" SET status = $1 WHERE id = $2', ['PROCESSING', emailRecord.id]);

    // 5. Throttling delay
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS));

    // 6. Send email via Fake SMTP
    try {
      const { previewUrl } = await MailerService.sendMail(
        emailRecord.senderEmail,
        emailRecord.recipientEmail,
        emailRecord.subject,
        emailRecord.body
      );

      // 7. Mark as SENT
      await pool.query(
        'UPDATE "EmailJob" SET status = $1, "sentAt" = NOW() WHERE id = $2',
        ['SENT', emailRecord.id]
      );

      console.log(`✅ Email sent to ${emailRecord.recipientEmail}. Preview: ${previewUrl}`);
      return { success: true, previewUrl };

    } catch (error: any) {
      await pool.query(
        'UPDATE "EmailJob" SET status = $1, "errorMessage" = $2 WHERE id = $3',
        ['FAILED', error.message, emailRecord.id]
      );
      throw error;
    }
  },
  { 
    connection: redisConnection, 
    concurrency: 5 
  }
);