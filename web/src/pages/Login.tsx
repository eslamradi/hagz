import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, signInWithGoogle } from '../services/auth';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--color-primary)] opacity-[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-2xl mb-5 shadow-lg shadow-[var(--color-primary)]/20">
            <span className="text-4xl">⚽</span>
          </div>
          <h1 className="text-4xl font-bold text-[var(--color-text)] tracking-tight">7agz</h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-lg">Football Booking Made Easy</p>
        </div>

        {/* Form card */}
        <div className="bg-[var(--color-surface)] rounded-3xl p-8 shadow-2xl border border-[var(--color-surface-light)] animate-fade-in stagger-1">
          <h2 className="text-2xl font-semibold text-[var(--color-text)] mb-8">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-xl text-[var(--color-error)] text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-[var(--color-background)] border border-[var(--color-surface-light)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)]/60 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none mt-2"
            >
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-surface-light)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 bg-white text-gray-800 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-[var(--color-text-muted)]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[var(--color-primary)] hover:text-[var(--color-primary-light)] font-medium transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Quick access */}
        <div className="mt-8 text-center animate-fade-in stagger-2">
          <p className="text-[var(--color-text-muted)]">
            Have a room code?{' '}
            <button
              onClick={() => {
                const code = prompt('Enter room code:');
                if (code) {
                  window.location.href = `/booking/${code}`;
                }
              }}
              className="text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium transition-colors"
            >
              Enter code
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
