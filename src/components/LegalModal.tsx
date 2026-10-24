import { useEffect, useRef, type ReactNode } from 'react';
import { SITE } from '../config/site';
import { IconX } from './icons';

function ExtLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-volt-700 underline underline-offset-2 hover:text-volt-600 dark:text-volt-300">
      {children}
    </a>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
    </section>
  );
}

/** Modale « Informations légales » (contenu imposé par le cahier des charges §5) */
export default function LegalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const linkedin = <ExtLink href={SITE.linkedinUrl}>LinkedIn</ExtLink>;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 print:hidden" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <h2 id="legal-title" className="text-base font-bold">
            Informations légales
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer">
            <IconX size={18} />
          </button>
        </header>

        <div className="divide-y divide-slate-100 px-5 pb-5 dark:divide-slate-800">
          <Section title="Éditeur du site">
            <p>
              Timothée Josso, particulier, développeur logiciel à Toulouse.
              <br />
              Responsable de la publication : Timothée Josso.
              <br />
              Contact : {linkedin}.
            </p>
          </Section>

          <Section title="Hébergeur">
            <p>GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis (service GitHub Pages).</p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Les textes, le code et la mise en page de ce site sont la propriété de Timothée Josso, sauf mention contraire. Les logos et icônes de
              technologies appartiennent à leurs propriétaires respectifs. Toute reproduction totale ou partielle sans autorisation préalable est
              interdite.
            </p>
          </Section>

          <Section title="Données personnelles">
            <p>Ce site ne comporte aucun formulaire, aucun compte et aucun cookie de suivi. Je ne collecte aucune donnée personnelle.</p>
            <p>
              Votre navigateur enregistre localement le thème choisi (clair ou sombre) et le fait que l’écran d’accueil a déjà été vu (via
              localStorage). Ces informations restent sur votre appareil.
            </p>
            <p>
              Pour s’afficher, la page charge des polices depuis Google Fonts, des icônes depuis jsDelivr et des ressources statiques. Ces services
              reçoivent votre adresse IP selon leurs propres politiques de confidentialité.
            </p>
            <p>
              Pour toute question, ou pour exercer vos droits d’accès, de rectification et de suppression prévus par le RGPD, contactez-moi via{' '}
              {linkedin}.
            </p>
          </Section>

          <Section title="Liens externes">
            <p>
              Ce site renvoie vers des services tiers (<ExtLink href={SITE.githubUrl}>GitHub</ExtLink>, {linkedin}). Je ne suis pas responsable de
              leur contenu.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
