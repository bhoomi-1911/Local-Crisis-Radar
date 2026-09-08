import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setBusy(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Something went wrong.'
      );
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="authwrap">
      <div className="authtabs">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => switchMode('login')}
        >
          Log in
        </button>

        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          onClick={() => switchMode('register')}
        >
          Register
        </button>
      </div>

      <div className="authcard">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {busy
              ? 'Please wait…'
              : mode === 'login'
                ? 'Log in'
                : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}