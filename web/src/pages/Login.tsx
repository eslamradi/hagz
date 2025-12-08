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
    <div className="min-h-screen bg-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <span className="text-7xl">⚽</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 tracking-tight">7agz</h1>
          <p className="text-xl text-white/80 max-w-md leading-relaxed">
            The easiest way to organize your weekly football matches. Create rooms, manage players, and track your games.
          </p>
          
          {/* Decorative elements */}
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-primary)] rounded-2xl mb-4">
              <span className="text-3xl">⚽</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]">7agz</h1>
          </div>

          <div className="animate-fade-in">
            <h2 className="text-[28px] font-semibold text-[var(--color-text)] mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              {isSignUp ? 'Start organizing your football games' : 'Sign in to continue to your rooms'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-[#fce8e6] border border-[var(--color-error)]/20 rounded-xl text-[var(--color-error)] text-sm">
                {error}
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 bg-white text-[var(--color-text)] font-medium rounded-xl border border-[var(--color-border-dark)] hover:bg-[var(--color-surface-secondary)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mb-6"
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
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[var(--color-text-muted)]">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
                    placeholder="Your name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-[var(--color-border-dark)] rounded-xl text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-text)] transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="mt-8 text-center text-[var(--color-text-secondary)]">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[var(--color-primary)] hover:underline font-semibold"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Quick access */}
          <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
            <p className="text-center text-[var(--color-text-secondary)] text-sm">
              Have a room code?{' '}
              <button
                onClick={() => {
                  const code = prompt('Enter room code:');
                  if (code) {
                    window.location.href = `/booking/${code}`;
                  }
                }}
                className="text-[var(--color-primary)] hover:underline font-semibold"
              >
                Join room
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
