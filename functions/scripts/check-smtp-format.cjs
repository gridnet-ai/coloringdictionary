const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env'), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);

const p = env.SMTP_PASS || '';
const stripped = p.replace(/\s+/g, '').replace(/^["']|["']$/g, '');

console.log(
  JSON.stringify(
    {
      user: env.SMTP_USER,
      host: env.SMTP_HOST,
      passLen: p.length,
      strippedLen: stripped.length,
      hasSpaces: /\s/.test(p),
      hasDollar: p.includes('$'),
      hasDigitsOnlyMix: /[0-9]/.test(stripped) && /[a-zA-Z]/.test(stripped),
      looksLikeAppPass: /^[a-zA-Z0-9]{16}$/.test(stripped),
      startsWithQuote: /^["']/.test(p),
    },
    null,
    2,
  ),
);
