import { useState } from 'react';
import type { BomCategory, BomLine, Circuit, InstallationResult } from '../types/electrical';
import { CATEGORY_LABELS, bomToCsv, formatSection } from '../rules/electricalRules';
import { ROOM_LABELS } from '../rules/catalog';
import { useElecStore } from '../store/useElecStore';
import { IconAlert, IconFileDown, IconInfo, IconPrinter, IconReset, IconShield, IconTable } from './icons';

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`text-right text-sm font-semibold ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function CircuitSheet({ circuit }: { circuit: Circuit }) {
  const s = circuit.spec;
  const dropOk = s.voltageDropPercent <= s.maxVoltageDropPercent;
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {circuit.ref} · {ROOM_LABELS[circuit.roomCategory]} · {circuit.points} point{circuit.points > 1 ? 's' : ''} · {circuit.lengthM} m
      </p>
      <h3 className="mt-0.5 text-base font-bold">{circuit.name}</h3>
      <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
        <Row label="Section minimale" value={formatSection(s.wireSection)} />
        <Row label="Disjoncteur divisionnaire" value={`${s.breakerRating} courbe C${s.requiresAfci ? ' + DDA' : ''}`} />
        <Row label="Différentiel 30 mA" value={s.differentialType} />
        <Row
          label="Pose"
          value={s.installation === 'CABLE' ? (s.cableDesignation ?? 'Câble') : `H07V-U · ICTA ${s.ictaDiameter.replace('mm', ' mm')}`}
        />
        <div className="flex items-baseline justify-between gap-3 py-1.5">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Chute de tension estimée</dt>
          <dd className={`text-sm font-semibold ${dropOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {String(s.voltageDropPercent).replace('.', ',')} % <span className="font-normal text-slate-400">/ {s.maxVoltageDropPercent} % max</span>
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Conducteurs</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {s.wires.map((w) => (
            <li key={w.role} className="chip">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={
                  w.role === 'EARTH'
                    ? { background: 'linear-gradient(90deg,#2e9d4a 50%,#f5c400 50%)' }
                    : { background: w.color }
                }
              />
              {w.label} · {w.colorName}
            </li>
          ))}
        </ul>
      </div>
      {s.notes.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {s.notes.map((n) => (
            <li key={n} className="flex gap-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <IconInfo size={14} className="mt-0.5 shrink-0 text-sky-500" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BoardSheet({ installation }: { installation: InstallationResult }) {
  if (installation.circuits.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Aucun circuit pour l’instant. Composez votre installation depuis le panneau de gauche.</p>;
  }
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={installation.circuits.length} label="circuits" />
        <Stat value={installation.groups.length} label="ID 30 mA" />
        <Stat value={installation.boardRows} label={`rangée${installation.boardRows > 1 ? 's' : ''}`} />
      </div>
      <ul className="mt-3 space-y-2">
        {installation.groups.map((g) => (
          <li key={g.id} className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
            <p className="text-sm font-semibold">
              {g.ref} · {g.rating} · {g.type}
              {g.dedicatedTo === 'IRVE' && <span className="badge ml-2">IRVE</span>}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {g.circuits.map((c) => `${c.ref} ${c.name} (${c.spec.breakerRating})`).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-slate-100 py-2 dark:bg-slate-800/70">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function BomTable({ lines }: { lines: BomLine[] }) {
  const categories = Array.from(new Set(lines.map((l) => l.category))) as BomCategory[];
  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th>Article</th>
          <th>Quantité</th>
        </tr>
      </thead>
      {categories.map((cat) => (
        <tbody key={cat}>
          <tr>
            <th colSpan={2} className="pb-1 pt-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {CATEGORY_LABELS[cat]}
            </th>
          </tr>
          {lines
            .filter((l) => l.category === cat)
            .map((l) => (
              <tr key={`${l.item}-${l.unit}`} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1.5 pr-3 text-[13px] leading-snug">{l.item}</td>
                <td className="whitespace-nowrap py-1.5 text-right font-mono text-[13px] font-semibold tabular-nums">
                  {l.quantity} <span className="font-sans text-xs font-normal text-slate-500">{l.unit === 'mètre' ? 'm' : l.unit === 'lot' ? `lot${l.quantity > 1 ? 's' : ''}` : 'pc'}</span>
                </td>
              </tr>
            ))}
        </tbody>
      ))}
    </table>
  );
}

/** Zone C — récapitulatif, sécurité et nomenclature */
export default function SummaryPanel({ installation }: { installation: InstallationResult }) {
  const activeView = useElecStore((s) => s.activeView);
  const reset = useElecStore((s) => s.reset);
  const settings = useElecStore((s) => s.settings);
  const [pdfHint, setPdfHint] = useState(false);
  const circuit = installation.circuits.find((c) => c.id === activeView);
  const empty = installation.circuits.length === 0;
  const hasTypeA = installation.groups.some((g) => g.type === 'Type A');

  const downloadCsv = () => {
    const blob = new Blob([bomToCsv(installation.billOfMaterials)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elecguide-nomenclature.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    setPdfHint(true);
    window.setTimeout(() => window.print(), 50);
  };

  const onReset = () => {
    if (empty || window.confirm('Réinitialiser toute la configuration ?')) reset();
  };

  return (
    <aside aria-label="Récapitulatif" className="flex min-w-0 flex-col gap-4 lg:col-span-2 xl:col-span-1">
      <section className="card p-4">
        <h2 className="section-title">Fiche technique</h2>
        <div className="mt-3">{circuit ? <CircuitSheet circuit={circuit} /> : <BoardSheet installation={installation} />}</div>
      </section>

      <section className="card p-4">
        <h2 className="section-title flex items-center gap-2">
          <IconShield size={16} className="text-emerald-500" /> Sécurité & conformité
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <SafetyItem
            ok={installation.surgeProtector.included}
            title="Parafoudre"
            status={
              installation.surgeProtector.required ? 'Obligatoire' : installation.surgeProtector.included ? 'Prévu (recommandé)' : 'Non prévu — recommandé'
            }
          />
          <SafetyItem
            ok={settings.afci}
            title="Protecteur d’arc (DDA / AFCI)"
            status={settings.afci ? `${installation.afciCount} circuit${installation.afciCount > 1 ? 's' : ''}` : 'Conseillé, non imposé'}
          />
          <SafetyItem ok={empty || hasTypeA} title="ID 30 mA Type A" status={empty ? '—' : hasTypeA ? 'Présent' : 'Manquant'} />
          <SafetyItem ok title="Différentiels 30 mA" status={empty ? '—' : `${installation.groups.length} · 8 circuits max chacun`} />
        </ul>
        {installation.globalWarnings.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
            {installation.globalWarnings.map((w) => (
              <li key={w} className="flex gap-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                <IconAlert size={14} className="mt-0.5 shrink-0" /> {w}
              </li>
            ))}
          </ul>
        )}
        {installation.globalNotes.length > 0 && (
          <details className="mt-3 text-xs text-slate-600 dark:text-slate-300">
            <summary className="cursor-pointer font-medium text-slate-500 dark:text-slate-400">Règles générales appliquées</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
              {installation.globalNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">Nomenclature</h2>
          <span className="text-xs text-slate-400">{installation.billOfMaterials.length} références</span>
        </div>
        {empty ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">La liste du matériel apparaîtra ici.</p>
        ) : (
          <div className="mt-1 max-h-[28rem] overflow-y-auto pr-1 scrollbar-thin">
            <BomTable lines={installation.billOfMaterials} />
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Longueurs majorées de 10 % ; descentes de commande estimées à 2,5 m. Quantités indicatives à ajuster sur le chantier.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-primary" onClick={exportPdf} disabled={empty}>
            <IconFileDown size={16} /> Exporter en PDF
          </button>
          <button type="button" className="btn" onClick={() => window.print()} disabled={empty}>
            <IconPrinter size={16} /> Imprimer
          </button>
          <button type="button" className="btn" onClick={downloadCsv} disabled={empty}>
            <IconTable size={16} /> Export CSV
          </button>
          <button type="button" className="btn btn-danger" onClick={onReset}>
            <IconReset size={16} /> Réinitialiser
          </button>
        </div>
        {pdfHint && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF » comme destination.
          </p>
        )}
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-slate-400">
        ElecGuide est un outil pédagogique d’aide à la conception. Il ne remplace ni la norme NF C 15-100, ni les notices des fabricants,
        ni l’intervention d’un électricien qualifié. Toute installation neuve ou rénovée doit faire l’objet d’une attestation de conformité (Consuel).
      </p>
    </aside>
  );
}

function SafetyItem({ ok, title, status }: { ok: boolean; title: string; status: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {title}
      </span>
      <span className="text-right text-xs text-slate-500 dark:text-slate-400">{status}</span>
    </li>
  );
}
