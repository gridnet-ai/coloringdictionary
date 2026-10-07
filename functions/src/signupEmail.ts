import { logger } from 'firebase-functions';
import {
  escapeHtml,
  sendHtmlEmail,
  SITE_ORIGIN,
  MAIL_FROM_NAME,
  smtpFrom,
  smtpUser,
} from './smtp';

/** Confirm launch-list signup + notify the brand inbox. */
export async function sendLaunchSignupEmails(opts: {
  email: string;
  source?: string;
}) {
  const email = opts.email.trim().toLowerCase();
  if (!email) {
    return { subscriber: { sent: false as const, reason: 'no_email' as const } };
  }

  const inbox = (
    smtpFrom.value().trim() ||
    smtpUser.value().trim() ||
    'hello@coloringdictionary.com'
  ).trim();

  const subscriber = await sendHtmlEmail({
    context: 'launch_signup_confirm',
    to: email,
    subject: 'You’re on the list — Coloring Dictionary',
    text: [
      'Hi,',
      '',
      'Thanks for joining the Coloring Dictionary list.',
      'We’ll share book previews, new subjects, and news about Flower Meanings · Volume One.',
      '',
      `Visit us anytime: ${SITE_ORIGIN}/`,
      '',
      'Color • Learn • Grow',
      MAIL_FROM_NAME,
      '',
      'If you did not sign up, you can ignore this email.',
    ].join('\n'),
    html: `
      <div style="font-family:Nunito Sans,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#153c40;line-height:1.55;background:#faf8f0;padding:28px">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#00505a;font-weight:700">${escapeHtml(MAIL_FROM_NAME)}</p>
        <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 14px;font-weight:400;color:#082f35">You’re on the list.</h1>
        <p style="margin:0 0 12px">Thanks for joining. We’ll share book previews, new subjects, and news about <strong>Flower Meanings · Volume One</strong>.</p>
        <p style="margin:0 0 24px">
          <a href="${SITE_ORIGIN}/" style="display:inline-block;background:#00505a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:5px;font-weight:700;font-size:13px">
            Visit Coloring Dictionary
          </a>
        </p>
        <p style="margin:0 0 6px;font-size:13px;color:#596d6b">Color • Learn • Grow</p>
        <p style="margin:0;font-size:12px;color:#596d6b">If you did not sign up, you can ignore this email.</p>
      </div>
    `,
  });

  const notify = await sendHtmlEmail({
    context: 'launch_signup_notify',
    to: inbox,
    subject: `New launch signup: ${email}`,
    text: [
      'New Coloring Dictionary launch-list signup.',
      `Email: ${email}`,
      `Source: ${opts.source || 'website'}`,
      `Time: ${new Date().toISOString()}`,
    ].join('\n'),
    html: `
      <div style="font-family:Nunito Sans,Segoe UI,sans-serif;max-width:560px;margin:0 auto;color:#153c40;line-height:1.5">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#00505a;font-weight:700">Launch list</p>
        <h1 style="font-size:20px;margin:0 0 12px">New signup</h1>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0 0 8px"><strong>Source:</strong> ${escapeHtml(opts.source || 'website')}</p>
        <p style="margin:0;font-size:13px;color:#596d6b">${escapeHtml(new Date().toISOString())}</p>
      </div>
    `,
  });

  logger.info('Launch signup emails attempted', {
    email,
    subscriberSent: subscriber.sent,
    notifySent: notify.sent,
  });

  return { subscriber, notify };
}
