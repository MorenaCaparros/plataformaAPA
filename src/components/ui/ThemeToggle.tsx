'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface Props {
  collapsed?: boolean;
}

export default function ThemeToggle({ collapsed = false }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl
        text-neutro-piedra hover:bg-sol-400/10 dark:hover:bg-sol-400/8
        border border-transparent hover:border-sol-400/20
        transition-all duration-200 active:scale-95 min-h-[44px]
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      {isDark
        ? <SunIcon  className="w-5 h-5 flex-shrink-0 text-sol-500" />
        : <MoonIcon className="w-5 h-5 flex-shrink-0 text-neutro-piedra" />
      }
      {!collapsed && (
        <span className="font-outfit font-medium text-sm text-neutro-piedra dark:text-dark-muted">
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </span>
      )}
    </button>
  );
}
