import type { Theme } from '../lib/useTheme';
import { IconBolt, IconHelp, IconMoon, IconSun } from './icons';

export default function Header({ theme, onToggleTheme, onHelp }: { theme: Theme; onToggleTheme: () => void; onHelp: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 print:static print:border-0">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-slate-900 p-2 text-volt-400 dark:bg-volt-400 dark:text-slate-900">
            <IconBolt size={20} />
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-none tracking-tight">ElecGuide</h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Câblage & dimensionnement · NF C 15-100</p>
          </div>
        </div>
        <div className="flex items-center gap-1 print:hidden">
          <button type="button" onClick={onHelp} className="icon-btn" aria-label="Afficher l’aide">
            <IconHelp size={18} />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-btn"
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
