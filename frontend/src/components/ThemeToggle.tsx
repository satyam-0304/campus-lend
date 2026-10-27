import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9 sm:h-10 sm:w-10',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-600 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white ${sizeClasses[size]} ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          size={iconSizes[size]}
          className={`transform text-amber-500 transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0 absolute' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          size={iconSizes[size]}
          className={`transform text-sky-400 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0 absolute'
          }`}
        />
      </div>
    </button>
  );
}
