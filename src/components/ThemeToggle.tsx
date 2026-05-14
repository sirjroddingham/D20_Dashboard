import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export default function ThemeToggle() {
  const dark = useThemeStore(s => s.dark);
  const toggle = useThemeStore(s => s.toggle);

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-text-subtle transition-colors hover:bg-surface-1 hover:text-text-heading"
      aria-label="Toggle dark mode"
    >
      {dark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
