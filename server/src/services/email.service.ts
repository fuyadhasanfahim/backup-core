import nodemailer from "nodemailer";
import { config } from "../config/env";
import { settingsService } from "./settings.service";
import logger from "../utils/logger";

export class EmailService {
  /**
   * Get a dynamic transporter configured with latest settings.
   */
  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    const settings = await settingsService.getAll();
    const smtpHost = settings.smtp_host || "";
    const smtpPort = parseInt(settings.smtp_port || "587");
    const smtpUser = settings.smtp_user || "";
    const smtpPass = settings.smtp_pass || "";

    if (smtpHost && smtpUser && smtpPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return null;
  }

  /**
   * Send a backup failure alert.
   */
  async sendFailureAlert(data: {
    dbName: string;
    error: string;
    date: Date;
    duration?: number;
  }) {
    const transporter = await this.getTransporter();
    const settings = await settingsService.getAll();
    const adminEmail = settings.admin_email || "";
    const fromEmail = settings.from_email || "backups@backendsafe.com";

    if (!transporter || !adminEmail) {
      logger.warn("⚠️  Email service not configured. Could not send failure alert.");
      return;
    }

    const subject = `❌ Backup FAILED: ${data.dbName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #f43f5e; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Backup Failure Alert</h1>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>A recent backup operation has failed for the following database:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Database:</strong> ${data.dbName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Error:</strong> <span style="color: #f43f5e;">${data.error}</span></p>
            ${data.duration ? `<p style="margin: 5px 0;"><strong>Duration:</strong> ${data.duration}s</p>` : ''}
          </div>
          <p>Please check the Backup Control Panel for more details.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${config.dashboardUrl}" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Dashboard</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #eee;">
          System Alert from BackendSafe
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"${fromEmail}" <${fromEmail}>`,
        to: adminEmail,
        subject,
        html,
      });
      logger.info(`✅ Failure alert email sent to ${adminEmail}`);
    } catch (error) {
      logger.error("❌ Failed to send alert email:", error);
    }
  }
}

export const emailService = new EmailService();
