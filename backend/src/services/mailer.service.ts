import nodemailer from 'nodemailer';

export class MailerService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getTransporter() {
    if (!this.transporter) {
      // Automatically generate a fake Ethereal account for testing
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
    return this.transporter;
  }

  static async sendMail(from: string, to: string, subject: string, html: string) {
    const transporter = await this.getTransporter();
    const info = await transporter.sendMail({
      from: `"${from}" <${from}>`,
      to,
      subject,
      html,
    });

    return {
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info), // Ethereal link to view the fake email
    };
  }
}