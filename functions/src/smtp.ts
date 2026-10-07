import { defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import nodemailer from 'nodemailer';

/** Copied from ai-locating (nodemailer → Gmail Workspace SMTP). */
export const SITE_ORIGIN = 'https://coloringdictionary.com';

/** Display name on outbound mail (alias-friendly). */
export const MAIL_FROM_NAME = 'Color Dictionary';

export const smtpHost = defineString('SMTP_HOST', { default: 'smtp.gmail.com' });
export const smtpPort = defineString('SMTP_PORT', { default: '587' });
export const smtpUser = defineString('SMTP_USER', {
  default: 'hello@coloringdictionary.com',
});
export const smtpFrom = defineString('SMTP_FROM', {
  default: 'hello@coloringdictionary.com',
});
export const smtpSecure = defineString('SMTP_SECURE', { default: 'false' });
export const smtpPass = defineString('SMTP_PASS', { default: '' });

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendHtmlEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  context?: string;
  replyTo?: string;
}) {
  const host = smtpHost.value().trim();
  const user = smtpUser.value().trim();
  /** App passwords may be stored with spaces; SMTP auth expects contiguous chars. */
  const pass = smtpPass.value().replace(/\s+/g, '');
  const fromAddr = (
    smtpFrom.value().trim() ||
    user ||
    'hello@coloringdictionary.com'
  ).trim();

  if (!host || !user || !pass) {
    logger.warn('SMTP not configured — skipping email.', {
      context: opts.context,
      to: opts.to,
    });
    return { sent: false as const, reason: 'smtp_unconfigured' as const };
  }

  const port = Number(smtpPort.value() || 587);
  const secure = smtpSecure.value() === 'true' || port === 465;
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `${MAIL_FROM_NAME} <${fromAddr}>`,
    to: opts.to,
    replyTo: opts.replyTo || fromAddr,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });

  return { sent: true as const };
}
