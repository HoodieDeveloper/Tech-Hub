import { FormEvent, useState } from 'react';
import { ArrowLeft, LockKeyhole, UserPlus } from 'lucide-react';
import {
  apiPost,
  setAuthSession,
  type AuthUser,
} from '../../core/api/client';

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type Props = {
  onSuccess: (user: AuthUser) => void;
  onBack: () => void;
};

export function LoginPage({ onSuccess, onBack }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = mode === 'login'
        ? await apiPost<AuthResponse>('/login', { email, password }, false)
        : await apiPost<AuthResponse>(
            '/register',
            {
              name,
              email,
              password,
              password_confirmation: passwordConfirmation,
            },
            false
          );

      setAuthSession(data.token, data.user);
      onSuccess(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} /> Back to products
      </button>

      <section className="auth-panel">
        <div className="auth-intro">
          <span className="auth-icon">
            {mode === 'login' ? <LockKeyhole size={28} /> : <UserPlus size={28} />}
          </span>
          <h1>{mode === 'login' ? 'Login to TechHub' : 'Create customer account'}</h1>
          <p>
            Admins and customers use this same login. After login, Laravel reads the
            role from Supabase PostgreSQL and sends each user to the correct page.
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              Confirm password
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                minLength={8}
                required
              />
            </label>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Login'
                : 'Create customer account'}
          </button>
        </form>

        {error && <div className="alert error">{error}</div>}
      </section>
    </div>
  );
}
