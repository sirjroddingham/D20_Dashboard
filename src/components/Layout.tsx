import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import D20Logo from '../public/just_the_d20.svg';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface-0">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-surface-3 sticky top-0 z-40 header-card backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
             <img src={D20Logo} alt="D20 Industries" className="h-8 w-8" />
             <span className="text-sm font-medium text-text-heading">D20 Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <main className="p-4 sm:p-6 flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-surface-3 py-3 footer-card backdrop-blur-sm text-center text-xs text-text-faint px-4">
          D20 Dashboard &middot; D20 Industries, LLC
        </footer>
      </div>
    </div>
  );
}
