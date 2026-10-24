import type { InstallationResult } from '../types/electrical';
import { WIRE_COLORS } from '../rules/electricalRules';
import { useElecStore } from '../store/useElecStore';
import { BoardDiagram } from './diagram/BoardDiagram';
import { CircuitDiagram } from './diagram/CircuitDiagram';
import { IconBoard } from './icons';

const LEGEND: { label: string; color: string; earth?: boolean }[] = [
  { label: 'Neutre', color: WIRE_COLORS.NEUTRAL },
  { label: 'Terre', color: WIRE_COLORS.EARTH_GREEN, earth: true },
  { label: 'Navette / retour', color: WIRE_COLORS.ORANGE },
  { label: 'Navette 2', color: WIRE_COLORS.VIOLET },
  { label: 'Retour lampe', color: WIRE_COLORS.BLACK },
];

function Swatch({ color, earth }: { color: string; earth?: boolean }) {
  return (
    <span
      className="inline-block h-1.5 w-6 rounded-full"
      style={
        earth
          ? { background: `repeating-linear-gradient(90deg, ${WIRE_COLORS.EARTH_GREEN} 0 6px, ${WIRE_COLORS.EARTH_YELLOW} 6px 12px)` }
          : { background: color }
      }
    />
  );
}

/** Zone B — visualiseur SVG : vue tableau + schéma multifilaire de chaque circuit */
export default function WiringDiagram({ installation }: { installation: InstallationResult }) {
  const activeView = useElecStore((s) => s.activeView);
  const setActiveView = useElecStore((s) => s.setActiveView);
  const phaseColor = useElecStore((s) => s.settings.phaseColor);
  const updateSettings = useElecStore((s) => s.updateSettings);

  const circuit = installation.circuits.find((c) => c.id === activeView);
  const group = circuit ? installation.groups.find((g) => g.id === circuit.groupId) : undefined;
  const phaseHex = phaseColor === 'BROWN' ? WIRE_COLORS.PHASE_BROWN : WIRE_COLORS.PHASE_RED;

  return (
    <section aria-label="Schéma de câblage" className="card flex min-w-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold">Schéma de câblage</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {circuit ? 'Vue multifilaire du circuit sélectionné' : 'Vue synoptique du tableau — cliquez un disjoncteur'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Phase</span>
          <div className="seg" role="radiogroup" aria-label="Couleur de la phase">
            {(['RED', 'BROWN'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={phaseColor === p}
                onClick={() => updateSettings({ phaseColor: p })}
                className={phaseColor === p ? 'seg-btn seg-btn-active' : 'seg-btn'}
              >
                <span
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: p === 'RED' ? WIRE_COLORS.PHASE_RED : WIRE_COLORS.PHASE_BROWN }}
                />
                {p === 'RED' ? 'Rouge' : 'Marron'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="scrollbar-thin flex gap-1.5 overflow-x-auto border-b border-slate-200 px-3 py-2 dark:border-slate-800" aria-label="Circuits">
        <button type="button" onClick={() => setActiveView('BOARD')} className={!circuit ? 'tab tab-active' : 'tab'}>
          <IconBoard size={14} /> Tableau
        </button>
        {installation.circuits.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveView(c.id)}
            className={c.id === activeView ? 'tab tab-active' : 'tab'}
            title={c.name}
          >
            <span className="font-mono font-bold">{c.ref}</span>
            <span className="max-w-[9rem] truncate">{c.name}</span>
            {c.spec.warnings.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="avertissement" />}
          </button>
        ))}
      </nav>

      <div className="flex-1 p-3">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700">
          <div className="min-w-[680px]">
            {circuit ? (
              <CircuitDiagram circuit={circuit} group={group} phaseColor={phaseColor} />
            ) : (
              <BoardDiagram installation={installation} phaseColor={phaseColor} onSelect={setActiveView} />
            )}
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400" aria-label="Légende des conducteurs">
          <li className="flex items-center gap-1.5">
            <Swatch color={phaseHex} /> Phase ({phaseColor === 'BROWN' ? 'marron' : 'rouge'})
          </li>
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <Swatch color={l.color} earth={l.earth} /> {l.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
