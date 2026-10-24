import type { InstallationResult, PhaseColor } from '../types/electrical';
import { NORM_REFERENCE, formatSection } from '../rules/electricalRules';
import { BoardDiagram } from './diagram/BoardDiagram';
import { CircuitDiagram } from './diagram/CircuitDiagram';
import { BomTable } from './SummaryPanel';

/** Dossier imprimable / PDF : uniquement visible à l'impression */
export default function PrintReport({ installation, phaseColor }: { installation: InstallationResult; phaseColor: PhaseColor }) {
  if (installation.circuits.length === 0) return null;
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="hidden bg-white px-2 text-slate-900 print:block">
      <h1 className="text-2xl font-extrabold">ElecGuide — Dossier d’installation</h1>
      <p className="text-sm text-slate-600">
        Édité le {date} · {NORM_REFERENCE}
      </p>

      <h2 className="mt-6 text-lg font-bold">Tableau de répartition</h2>
      <div className="avoid-break mt-2 border border-slate-300">
        <BoardDiagram installation={installation} phaseColor={phaseColor} />
      </div>

      <h2 className="mt-6 text-lg font-bold">Récapitulatif des circuits</h2>
      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-slate-400 text-left">
            <th className="py-1">Repère</th>
            <th>Circuit</th>
            <th>Points</th>
            <th>Section</th>
            <th>Disjoncteur</th>
            <th>Différentiel</th>
            <th>Pose</th>
            <th>ΔU</th>
          </tr>
        </thead>
        <tbody>
          {installation.circuits.map((c) => (
            <tr key={c.id} className="border-b border-slate-200">
              <td className="py-1 font-mono font-bold">{c.ref}</td>
              <td>{c.name}</td>
              <td>{c.points}</td>
              <td>{formatSection(c.spec.wireSection)}</td>
              <td>
                {c.spec.breakerRating}
                {c.spec.requiresAfci ? ' + DDA' : ''}
              </td>
              <td>
                {c.groupId} · {c.spec.differentialType}
              </td>
              <td>{c.spec.installation === 'CABLE' ? c.spec.cableDesignation : `ICTA ${c.spec.ictaDiameter}`}</td>
              <td>{String(c.spec.voltageDropPercent).replace('.', ',')} %</td>
            </tr>
          ))}
        </tbody>
      </table>

      {installation.circuits.map((c) => (
        <section key={c.id} className="avoid-break mt-6">
          <div className="border border-slate-300">
            <CircuitDiagram
              circuit={c}
              group={installation.groups.find((g) => g.id === c.groupId)}
              phaseColor={phaseColor}
              idPrefix="print"
            />
          </div>
          <ul className="mt-1 list-disc pl-5 text-[11px] text-slate-600">
            {[...c.spec.notes, ...c.spec.warnings].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-6 break-before-page">
        <h2 className="text-lg font-bold">Nomenclature du matériel</h2>
        <BomTable lines={installation.billOfMaterials} />
      </section>

      <section className="avoid-break mt-6 text-[11px] text-slate-600">
        <h2 className="text-sm font-bold text-slate-900">Règles générales</h2>
        <ul className="mt-1 list-disc pl-5">
          {installation.globalNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="mt-3">
          Document indicatif produit par ElecGuide. Il ne remplace ni la norme NF C 15-100, ni les notices des fabricants, ni l’avis d’un
          électricien qualifié.
        </p>
      </section>
    </div>
  );
}
