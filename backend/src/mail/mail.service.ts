// src/mail/mail.service.ts
// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommunicationLog, CommunicationLogDocument } from './schemas/communication-log.schema';
import { EmailQueue, EmailQueueDocument } from './schemas/email-queue.schema';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import { genericEmailTemplate, emailButton } from './generic-email.template';
import { getAdminNotificationEmail } from '../common/admin-notification-email';

export const ILLUSTRATION_ATTACHMENT = {
  filename: 'illustration.png',
  path: join(process.cwd(), 'assets', 'illustration.png'),
  cid: 'illustration',
};


@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectModel(CommunicationLog.name)
    private communicationLogModel: Model<CommunicationLogDocument>,
    @InjectModel(EmailQueue.name)
    private emailQueueModel: Model<EmailQueueDocument>,
  ) {}

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    rateDelta: 2000,
    rateLimit: 5,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendEmail(to: string, subject: string, htmlBody: string, attachments: any[] = []) {
    try {
      return await this.transporter.sendMail({
        from: `"Deal Flow" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlBody,
        attachments,
      });
    } catch (error) {
      this.logger.error(`Error sending email: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async sendEmailWithLogging(
    recipientEmail: string,
    recipientType: string,
    subject: string,
    body: string,
    attachments: any[] = [],
    relatedDealId?: string,
  ): Promise<void> {
    await this.processQueue(10);

    try {
      await this.sendEmail(recipientEmail, subject, body, attachments);

      await this.communicationLogModel.create({
        recipientEmail,
        recipientType,
        subject,
        body,
        sentAt: new Date(),
        communicationType: 'email',
        status: 'sent',
        relatedDealId,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.communicationLogModel.create({
        recipientEmail,
        recipientType,
        subject,
        body,
        sentAt: new Date(),
        communicationType: 'email',
        status: 'failed',
        relatedDealId,
      });

      await this.enqueueRetry({
        recipientEmail,
        recipientType,
        subject,
        body,
        attachments,
        relatedDealId,
        lastError: errorMessage,
      });
      await this.notifyAdminQueueFailure(recipientEmail, subject, errorMessage);
      throw err;
    }
  }

  private async enqueueRetry(params: {
    recipientEmail: string;
    recipientType: string;
    subject: string;
    body: string;
    attachments?: any[];
    relatedDealId?: string;
    lastError: string;
  }): Promise<void> {
    await this.emailQueueModel.create({
      recipientEmail: params.recipientEmail,
      recipientType: params.recipientType,
      subject: params.subject,
      body: params.body,
      attachments: params.attachments || [],
      relatedDealId: params.relatedDealId,
      attempts: 1,
      maxAttempts: 5,
      nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
      lastError: params.lastError,
      status: "pending",
    });
  }

  private async notifyAdminQueueFailure(recipientEmail: string, subject: string, reason: string): Promise<void> {
    try {
      const alertSubject = "CIM Amplify Email Delivery Failure Alert";
      const alertBody = genericEmailTemplate(
        alertSubject,
        "Admin",
        `<p>Email delivery failed and was queued for retry.</p>
         <p><strong>Recipient:</strong> ${recipientEmail}</p>
         <p><strong>Subject:</strong> ${subject}</p>
         <p><strong>Error:</strong> ${reason}</p>`,
      );
      await this.sendEmail(getAdminNotificationEmail(), alertSubject, alertBody, [ILLUSTRATION_ATTACHMENT]);
    } catch {
      // Intentionally ignore to avoid recursive failures.
    }
  }

  async processQueue(limit = 20): Promise<void> {
    const now = new Date();
    const queuedItems = await this.emailQueueModel
      .find({ status: "pending", nextRetryAt: { $lte: now } })
      .sort({ nextRetryAt: 1 })
      .limit(limit)
      .exec();

    for (const queued of queuedItems) {
      try {
        await this.sendEmail(queued.recipientEmail, queued.subject, queued.body, queued.attachments || []);

        queued.status = "sent";
        queued.lastError = null;
        await queued.save();

        await this.communicationLogModel.create({
          recipientEmail: queued.recipientEmail,
          recipientType: queued.recipientType,
          subject: queued.subject,
          body: queued.body,
          sentAt: new Date(),
          communicationType: "email",
          status: "sent",
          relatedDealId: queued.relatedDealId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        queued.attempts += 1;
        queued.lastError = errorMessage;

        if (queued.attempts >= queued.maxAttempts) {
          queued.status = "dead";
          await this.notifyAdminQueueFailure(queued.recipientEmail, queued.subject, `Permanent failure: ${errorMessage}`);
        } else {
          const nextDelayMinutes = Math.min(60, Math.pow(2, queued.attempts) * 5);
          queued.nextRetryAt = new Date(Date.now() + nextDelayMinutes * 60 * 1000);
        }
        await queued.save();
      }
    }
  }
  async sendResetPasswordEmail(to: string, name: string, resetLink: string): Promise<void> {
    const subject = 'Reset your password';
    const emailContent = `
      <p>Click the button below to reset your password:</p>
      ${emailButton('Reset Password', resetLink)}
      <p>This link will expire in 15 minutes.</p>
    `;

    const emailBody = genericEmailTemplate(subject, name, emailContent);

    await this.sendEmailWithLogging(to, 'user', subject, emailBody, [ILLUSTRATION_ATTACHMENT]);
  }

  async sendEmailDeliveryIssueNotification(
    userEmail: string,
    userName: string,
    userRole: 'buyer' | 'seller',
    contactInfo: {
      companyName?: string;
      phone?: string;
      website?: string;
    },
  ): Promise<void> {
    const subject = `Email Delivery Issue Report - ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Registration`;
    const emailContent = `
      <p style="font-size: 16px; margin-bottom: 20px;">A new user has reported that they did not receive their welcome email after registration.</p>

      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #1a1a1a; font-size: 18px; font-weight: 700; margin: 0 0 16px 0; border-bottom: 2px solid #3aafa9; padding-bottom: 8px;">User Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; width: 120px; font-size: 14px;">Name:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;">${userName || 'Not provided'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; font-size: 14px;">Email:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;"><a href="mailto:${userEmail}" style="color: #3aafa9; text-decoration: none;">${userEmail}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; font-size: 14px;">Phone:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;">${contactInfo.phone ? `<a href="tel:${contactInfo.phone}" style="color: #3aafa9; text-decoration: none;">${contactInfo.phone}</a>` : 'Not provided'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; font-size: 14px;">Company:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;">${contactInfo.companyName || 'Not provided'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; font-size: 14px;">Website:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;">${contactInfo.website ? `<a href="${contactInfo.website}" target="_blank" style="color: #3aafa9; text-decoration: none;">${contactInfo.website}</a>` : 'Not provided'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; font-size: 14px;">Role:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;"><span style="background-color: ${userRole === 'buyer' ? '#dbeafe' : '#dcfce7'}; color: ${userRole === 'buyer' ? '#1d4ed8' : '#16a34a'}; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 700;">${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span></td>
          </tr>
          <tr>
            <td style="padding: 12px 8px; font-weight: 700; color: #374151; font-size: 14px;">Reported At:</td>
            <td style="padding: 12px 8px; font-weight: 600; color: #1a1a1a; font-size: 15px;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-top: 20px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-weight: 700; color: #92400e; font-size: 15px;">Action Required</p>
        <p style="margin: 8px 0 0 0; color: #78350f; font-size: 14px;">Please contact this user to assist with their email delivery issue and ensure they can access the platform.</p>
      </div>
    `;

    const emailBody = genericEmailTemplate(subject, 'Support Team', emailContent);

    await this.sendEmailWithLogging(
      getAdminNotificationEmail(),
      'admin',
      subject,
      emailBody,
      [ILLUSTRATION_ATTACHMENT],
    );
  }
}
