import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { userData, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-surface-light)] sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-18 py-4">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/10 group-hover:shadow-[var(--color-primary)]/20 transition-shadow">
                <span className="text-white font-bold text-lg">⚽</span>
              </div>
              <span className="text-xl font-bold text-[var(--color-text)]">7agz</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`px-5 py-2.5 rounded-xl transition-all font-medium ${
                  isActive('/dashboard')
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)]'
                }`}
              >
                Browse
              </Link>
              
              <Link
                to="/my-bookings"
                className={`px-5 py-2.5 rounded-xl transition-all font-medium ${
                  isActive('/my-bookings')
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-light)]'
                }`}
              >
                My Rooms
              </Link>

              {/* User menu */}
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[var(--color-surface-light)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-sm font-semibold">
                    {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-[var(--color-text)] text-sm font-medium hidden sm:block">
                    {userData?.displayName}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg transition-all"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
};

export default Layout;
