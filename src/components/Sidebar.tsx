import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { useLayoutStore } from '../store/useLayoutStore';
import { useThemeStore } from '../store/useThemeStore';

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}

function NavItem({ to, label, icon, isActive }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-md p-2 transition-all duration-200 ${
        isActive 
          ? 'bg-primary/20 text-primary font-medium' 
          : 'text-text-body hover:bg-surface-hover hover:text-foreground'
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useLayoutStore();
  useThemeStore();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'RTS Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/da-performance', label: 'DA Performance', icon: <UserCircle className="h-5 w-5" /> },
    { to: '/cdf-dsb', label: 'CDF/DSB', icon: <FileSpreadsheet className="h-5 w-5" /> },
  ];

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? 240 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen bg-surface-1 border-r border-surface-3 flex flex-col sticky top-0 z-50"
    >
      <div className="p-4 flex items-center justify-between h-16 border-b border-surface-3">
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="font-bold text-text-heading truncate"
          >
            D20 Dashboard
          </motion.div>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-surface-hover text-text-body"
        >
          {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem 
            key={item.to} 
            {...item} 
            isActive={location.pathname === item.to} 
          />
        ))}
      </nav>
    </motion.aside>
  );
}
