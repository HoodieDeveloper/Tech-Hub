import { FormEvent, useState } from 'react';
import { apiPost, setToken } from '../../core/api/client';

type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const data = await apiPost<LoginResponse>('/login', { email, password }, false);
      setToken(data.token);
      setMessage(`Logged in as ${data.user.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return (
    <section className="auth-card">
      <h2>Login</h2>
      <p>Use Laravel Sanctum token login.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </label>

        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </label>

        <button type="submit">Login</button>
      </form>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
