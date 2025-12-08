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
      {/* Header - Clean Airbnb-style */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-[var(--color-primary)] rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-white text-xl">⚽</span>
              </div>
              <span className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">7agz</span>
            </Link>

            {/* Navigation - Pill style */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center bg-[var(--color-surface-secondary)] rounded-full p-1">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                    isActive('/dashboard')
                      ? 'bg-white text-[var(--color-text)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  Browse Rooms
                </Link>
                
                <Link
                  to="/my-bookings"
                  className={`inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium transition-all min-h-[40px] ${
                    isActive('/my-bookings')
                      ? 'bg-white text-[var(--color-text)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                  }`}
                >
                  My Rooms
                </Link>
              </div>
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-3 pr-4 py-2 border border-[var(--color-border)] rounded-full hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold">
                  {userData?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-[var(--color-text)] text-sm font-medium hidden sm:block max-w-[120px] truncate">
                  {userData?.displayName}
                </span>
              </div>
              <button
                onClick={signOut}
                className="p-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-secondary)] rounded-full transition-all"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
