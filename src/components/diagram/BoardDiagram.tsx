import type { InstallationResult, PhaseColor } from '../../types/electrical';
import { WIRE_COLORS, formatSection } from '../../rules/electricalRules';
import { INK, MUTED, Module, PAPER, Wire } from './primitives';

const W = 900;
const ROW_H = 150;
const TOP = 150;
const BREAKER_X0 = 330;
const BREAKER_STEP = 68;

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function diffAccent(type: string): string {
  switch (type) {
    case 'Type A':
      return '#2563eb';
    case 'Type F':
      return '#9333ea';
    case 'Type B':
      return '#dc2626';
    default:
      return '#16a34a';
  }
}

/** Vue synoptique du tableau : AGCP, parafoudre, interrupteurs différentiels et disjoncteurs */
export function BoardDiagram({
  installation,
  phaseColor,
  activeCircuitId,
  onSelect,
}: {
  installation: InstallationResult;
  phaseColor: PhaseColor;
  activeCircuitId?: string;
  onSelect?: (circuitId: string) => void;
}) {
  const L = phaseColor === 'BROWN' ? WIRE_COLORS.PHASE_BROWN : WIRE_COLORS.PHASE_RED;
  const N = WIRE_COLORS.NEUTRAL;
  const groups = installation.groups;
  const H = groups.length === 0 ? 260 : TOP + groups.length * ROW_H + 30;
  const lastRowY = TOP + (groups.length - 1) * ROW_H;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Vue synoptique du tableau électrique"
      fontFamily="Inter, system-ui, sans-serif"
    >
      <rect width={W} height={H} fill={PAPER} />
      <rect x={10} y={10} width={W - 20} height={H - 20} rx={14} fill="#f8fafc" stroke="#cbd5e1" />
      <text x={28} y={36} fontSize={11} fontWeight={800} fill={MUTED} letterSpacing={1.5}>
        TABLEAU DE RÉPARTITION
      </text>
      <text x={W - 28} y={36} fontSize={10} fill={MUTED} textAnchor="end">
        {installation.circuits.length} circuit{installation.circuits.length > 1 ? 's' : ''} · {installation.boardModules} modules ·{' '}
        {installation.boardRows} rangée{installation.boardRows > 1 ? 's' : ''} (réserve 20 %)
      </text>

      {/* Arrivée et AGCP */}
      <Wire points={[[70, 50], [70, 60]]} color={L} />
      <Wire points={[[110, 50], [110, 60]]} color={N} />
      <Module x={30} y={60} w={120} h={66} title="AGCP" subtitle="Disjoncteur de branchement" accent="#475569" />
      {installation.surgeProtector.included && (
        <g>
          <Module x={170} y={60} w={86} h={66} title="Parafoudre" subtitle="Type 2 · 1P+N" accent="#f59e0b" />
          <Wire points={[[190, 126], [190, 136], [70, 136]]} color={L} />
          <Wire points={[[236, 126], [236, 142], [110, 142]]} color={N} />
        </g>
      )}

      {groups.length === 0 && (
        <text x={W / 2} y={190} fontSize={13} textAnchor="middle" fill={MUTED}>
          Ajoutez des circuits depuis le catalogue pour composer le tableau.
        </text>
      )}

      {groups.length > 0 && (
        <g>
          <Wire points={[[70, 126], [70, lastRowY - 20]]} color={L} />
          <Wire points={[[110, 126], [110, lastRowY - 10]]} color={N} />
        </g>
      )}

      {groups.map((g, gi) => {
        const y = TOP + gi * ROW_H;
        const lastX = BREAKER_X0 + (g.circuits.length - 1) * BREAKER_STEP;
        return (
          <g key={g.id}>
            {/* alimentation de l'ID */}
            <Wire points={[[70, y - 20], [210, y - 20], [210, y]]} color={L} />
            <Wire points={[[110, y - 10], [250, y - 10], [250, y]]} color={N} />
            <Module
              x={180}
              y={y}
              w={100}
              h={90}
              title={`${g.ref} 30 mA`}
              subtitle={`${g.rating} · ${g.type}`}
              accent={diffAccent(g.type)}
            />
            <text x={230} y={y + 106} fontSize={8.5} textAnchor="middle" fill={MUTED}>
              {g.dedicatedTo === 'IRVE' ? 'dédié IRVE' : `${g.circuits.length}/8 circuits`}
            </text>
            {/* peigne */}
            <Wire points={[[280, y + 30], [300, y + 30], [300, y - 14], [lastX + 20, y - 14]]} color={L} />
            <Wire points={[[280, y + 50], [310, y + 50], [310, y - 6], [lastX + 40, y - 6]]} color={N} />
            {g.circuits.map((c, ci) => {
              const x = BREAKER_X0 + ci * BREAKER_STEP;
              const active = c.id === activeCircuitId;
              return (
                <g
                  key={c.id}
                  onClick={onSelect ? () => onSelect(c.id) : undefined}
                  style={onSelect ? { cursor: 'pointer' } : undefined}
                >
                  <title>
                    {c.ref} — {c.name} : {formatSection(c.spec.wireSection)}, {c.spec.breakerRating}
                  </title>
                  <Wire points={[[x + 20, y - 14], [x + 20, y]]} color={L} />
                  <Wire points={[[x + 40, y - 6], [x + 40, y]]} color={N} />
                  <Module
                    x={x}
                    y={y}
                    w={58}
                    h={90}
                    title={c.spec.breakerRating}
                    subtitle={formatSection(c.spec.wireSection)}
                    accent={c.spec.requiresAfci ? '#f97316' : L}
                    highlight={active}
                  />
                  <text x={x + 29} y={y + 106} fontSize={10} fontWeight={800} textAnchor="middle" fill={INK}>
                    {c.ref}
                  </text>
                  <text x={x + 29} y={y + 118} fontSize={8} textAnchor="middle" fill={MUTED}>
                    {truncate(c.name, 13)}
                  </text>
                  {c.spec.requiresAfci && (
                    <text x={x + 29} y={y + 129} fontSize={7.5} textAnchor="middle" fill="#f97316" fontWeight={700}>
                      DDA
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
