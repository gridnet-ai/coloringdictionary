import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

type AuthForm = 'signin' | 'signup';
type Step = 'welcome' | 'email' | 'credentials';

const EMAIL_DOMAINS = [
  '@gmail.com',
  '@icloud.com',
  '@outlook.com',
  '@yahoo.com',
  '@hotmail.com',
] as const;

function applyEmailDomain(value: string, domain: string) {
  const at = value.indexOf('@');
  const local = (at === -1 ? value : value.slice(0, at)).trim();
  return `${local}${domain}`;
}

function matchingEmailDomains(value: string) {
  const at = value.indexOf('@');
  const local = (at === -1 ? value : value.slice(0, at)).trim();
  if (!local) return [];
  if (at === -1) return [...EMAIL_DOMAINS];
  const typed = value.slice(at).toLowerCase();
  if (typed === '@') return [...EMAIL_DOMAINS];
  if (EMAIL_DOMAINS.some((d) => d === typed)) return [];
  return EMAIL_DOMAINS.filter((d) => d.startsWith(typed));
}

function GoogleIcon() {
  return (
    <svg className="login-provider-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l.1.1 6.2 5.2C39.2 37.3 44 33 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { ready, user, isOwnerWorkspace, signInEmail, signUpEmail, signInGoogle } =
    useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<AuthForm>('signin');
  const [step, setStep] = useState<Step>('welcome');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!ready) {
    return (
      <main className="login-screen">
        <p className="login-legal">Loading…</p>
      </main>
    );
  }
  if (user && isOwnerWorkspace) return <Navigate to="/owner" replace />;
  if (user && !isOwnerWorkspace) {
    return (
      <main className="login-screen">
        <div className="login-panel">
          <p className="login-error">
            Signed in, but this account is not on the owner allowlist. Add your
            email to VITE_OWNER_EMAILS and create a staff role.
          </p>
          <Link className="login-primary" to="/" style={{ textAlign: 'center' }}>
            Back to site
          </Link>
        </div>
      </main>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (form === 'signin') await signInEmail(email.trim(), password);
      else await signUpEmail(name.trim(), email.trim(), password);
      navigate('/owner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  const domains = matchingEmailDomains(email);

  return (
    <main className={`login-screen${step === 'welcome' ? ' login-screen--welcome' : ''}`}>
      <Link className="login-close" to="/" aria-label="Close">
        <span>×</span>
      </Link>

      {step === 'welcome' ? (
        <div className="login-welcome">
          <div className="login-brand">
            <div className="login-avatar login-avatar--welcome">
              <img
                className="login-avatar-img"
                src="/icons/icon.png"
                alt=""
              />
            </div>
            <h1 className="login-wordmark">Coloring Dictionary</h1>
            <p className="login-legal">Owner workspace</p>
          </div>
          <div className="login-actions">
            <button
              type="button"
              className="login-provider"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await signInGoogle();
                  navigate('/owner');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Google sign-in failed');
                } finally {
                  setBusy(false);
                }
              }}
            >
              <GoogleIcon /> Continue with Google
            </button>
            <button
              type="button"
              className="login-primary"
              onClick={() => setStep('email')}
            >
              Continue with email
            </button>
            <p className="login-legal">
              A dictionary that you can color.
            </p>
          </div>
        </div>
      ) : (
        <div className="login-panel">
          <div className="login-brand">
            <div className="login-avatar">
              <img className="login-avatar-img" src="/icons/icon.png" alt="" />
            </div>
            <h1 className="login-wordmark">Coloring Dictionary</h1>
          </div>

          {step === 'credentials' ? (
            <div className="login-subtabs">
              <button
                type="button"
                className={form === 'signin' ? 'is-active' : ''}
                onClick={() => setForm('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                className={form === 'signup' ? 'is-active' : ''}
                onClick={() => setForm('signup')}
              >
                Create account
              </button>
            </div>
          ) : null}

          <form className="login-form" onSubmit={onSubmit}>
            {step === 'email' ? (
              <>
                <label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                  />
                </label>
                {domains.length ? (
                  <div className="login-email-domains">
                    {domains.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="login-email-domain"
                        onClick={() => setEmail(applyEmailDomain(email, d))}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                ) : null}
                <button
                  type="button"
                  className="login-primary"
                  disabled={!email.includes('@')}
                  onClick={() => setStep('credentials')}
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <p className="login-email-chip">
                  {email}{' '}
                  <button
                    type="button"
                    className="login-email-edit"
                    onClick={() => setStep('email')}
                  >
                    Edit
                  </button>
                </p>
                {form === 'signup' ? (
                  <label>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                    />
                  </label>
                ) : null}
                <label>
                  <input
                    type="password"
                    autoComplete={form === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="Password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    minLength={6}
                  />
                </label>
                <button className="login-primary" type="submit" disabled={busy}>
                  {busy ? 'Working…' : form === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </>
            )}
          </form>

          {step === 'credentials' ? (
            <>
              <div className="login-divider">or</div>
              <div className="login-providers">
                <button
                  type="button"
                  className="login-provider"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await signInGoogle();
                      navigate('/owner');
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : 'Google sign-in failed',
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <GoogleIcon /> Continue with Google
                </button>
              </div>
            </>
          ) : null}

          {error ? <p className="login-error">{error}</p> : null}
        </div>
      )}
    </main>
  );
}
