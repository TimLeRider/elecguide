import { useEffect } from 'react';
import { IconBolt } from './icons';

const STEPS = [
  { n: '1', title: 'Choisissez l’espace', text: 'Pièce sèche, pièce humide ou extérieur : les règles de pose s’adaptent.' },
  { n: '2', title: 'Ajoutez vos besoins', text: 'Éclairage, prises, circuits spécialisés, PAC, borne de recharge…' },
  { n: '3', title: 'Lisez le schéma', text: 'Schéma multifilaire coloré, tableau, sections, calibres et différentiels.' },
  { n: '4', title: 'Exportez la liste', text: 'Nomenclature complète en PDF, impression ou CSV.' },
];

/** Écran d'accueil affiché à la première visite (mémorisé en localStorage) */
export default function WelcomeScreen({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm print:hidden">
      <div role="dialog" aria-modal="true" aria-labelledby="welcome-title" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="relative bg-slate-900 px-6 pb-6 pt-7 text-white">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex items-center gap-3">
            <span className="rounded-xl bg-volt-400 p-2 text-slate-900">
              <IconBolt size={22} />
            </span>
            <div>
              <h2 id="welcome-title" className="text-xl font-extrabold tracking-tight">
                Bienvenue sur ElecGuide
              </h2>
              <p className="text-sm text-slate-300">Schémas de câblage & dimensionnement NF C 15-100</p>
            </div>
          </div>
        </div>
        <ol className="grid gap-3 p-6 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-volt-100 text-sm font-bold text-volt-700 dark:bg-volt-500/20 dark:text-volt-300">
                {s.n}
              </span>
              <span>
                <span className="block text-sm font-semibold">{s.title}</span>
                <span className="block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Outil pédagogique : les résultats doivent être vérifiés au regard de la norme, des notices fabricants et, si besoin, par un électricien
            qualifié. Tout fonctionne dans votre navigateur, aucune donnée n’est envoyée.
          </p>
          <button type="button" onClick={onClose} className="btn btn-primary mt-4 w-full">
            Commencer
          </button>
        </div>
      </div>
    </div>
  );
}
