import { useState } from 'react';
import { SITE } from '../config/site';
import LegalModal from './LegalModal';

/** Pied de page présent sur chaque page (cahier des charges §5) */
export default function Footer() {
  const [open, setOpen] = useState(false);
  return (
    <footer className="border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
        <p>
          © {SITE.year} {SITE.author}. Site statique en JavaScript, déployé avec GitHub Actions.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white print:hidden"
        >
          Informations légales
        </button>
      </div>
      <LegalModal open={open} onClose={() => setOpen(false)} />
    </footer>
  );
}
