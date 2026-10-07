const nodemailer = require('nodemailer');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const envPath = resolve(__dirname, '../.env');
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const to = process.argv[2] || 'laterrancefrench@gmail.com';
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || 587);
const user = (process.env.SMTP_USER || '').trim();
/** Gmail app passwords often stored with spaces — strip for SMTP auth. */
const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const from = (process.env.SMTP_FROM || user).trim();

if (!user || !pass) {
  console.error('SMTP_USER / SMTP_PASS missing in functions/.env');
  process.exit(1);
}

async function main() {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: `Color Dictionary <${from}>`,
    to,
    subject: 'Test from Coloring Dictionary',
    text: 'This is a test email from Color Dictionary (hello@coloringdictionary.com) via Gmail SMTP.',
    html:
      '<div style="font-family:sans-serif;color:#153c40;max-width:560px">' +
      '<p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#00505a;font-weight:700">Color Dictionary</p>' +
      '<h1 style="font-size:22px;margin:0 0 12px">Test email</h1>' +
      '<p>This is a test from <strong>hello@coloringdictionary.com</strong> via Gmail SMTP.</p>' +
      '<p style="color:#596d6b;font-size:13px">Color • Learn • Grow</p>' +
      '</div>',
  });

  console.log('SENT', info.messageId || info.response);
}

main().catch((err) => {
  console.error('FAIL', err.response || err.message || err);
  process.exit(1);
});
