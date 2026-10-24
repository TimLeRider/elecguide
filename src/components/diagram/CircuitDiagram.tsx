import type { ReactNode } from 'react';
import type { Circuit, DifferentialGroup, DifferentialType, PhaseColor } from '../../types/electrical';
import { APPLIANCE_LABELS, IRVE_LABELS } from '../../rules/catalog';
import { WIRE_COLORS, formatSection } from '../../rules/electricalRules';
import {
  DeviceBox,
  INK,
  Junction,
  LampGlyph,
  MUTED,
  Module,
  PAPER,
  PushGlyph,
  SocketGlyph,
  SwitchGlyph,
  Terminal,
  TwoWayGlyph,
  Wire,
  WireLabel,
} from './primitives';

/*
 * Schéma multifilaire d'un circuit.
 * Repères fixes :
 *  - Tableau à gauche (x 16 → 266) : ID 30 mA → disjoncteur → module auxiliaire éventuel.
 *  - Trois barres de distribution horizontales : N (y 300), L (y 330), PE (y 360).
 *  - Les récepteurs et commandes se piquent sur ces barres.
 */

const W = 900;
const H = 420;
const N_Y = 300;
const P_Y = 330;
const E_Y = 360;
// Bornes du disjoncteur / ID
const BL = 76;
const BN = 116;
// Module auxiliaire (télérupteur, contacteur)
const AUX = { x: 176, y: 140, w: 74, h: 84, a1: 192, a2: 234 };

export const DIFF_ACCENT: Record<DifferentialType, string> = {
  'Type AC': '#16a34a',
  'Type A': '#2563eb',
  'Type F': '#9333ea',
  'Type B': '#dc2626',
};

interface Colors {
  L: string;
  N: string;
  T1: string;
  T2: string;
  R: string;
  C: string;
}

function colors(phase: PhaseColor): Colors {
  return {
    L: phase === 'BROWN' ? WIRE_COLORS.PHASE_BROWN : WIRE_COLORS.PHASE_RED,
    N: WIRE_COLORS.NEUTRAL,
    T1: WIRE_COLORS.ORANGE,
    T2: WIRE_COLORS.VIOLET,
    R: WIRE_COLORS.BLACK,
    C: WIRE_COLORS.ORANGE,
  };
}

interface Field {
  body: ReactNode;
  aux?: ReactNode;
  phaseViaContactor?: boolean;
  drops: { L: number[]; N: number[]; PE: number[] };
  footnote?: string;
}

// ─── Gabarits ────────────────────────────────────────────────────────────────

function simplePoints(circuit: Circuit, c: Colors, target: 'LAMP' | 'SOCKET'): Field {
  const shown = Math.min(circuit.points, 3);
  const body: ReactNode[] = [];
  const drops: Field['drops'] = { L: [], N: [], PE: [] };
  for (let i = 0; i < shown; i++) {
    const x0 = 340 + i * 190;
    body.push(
      <g key={i}>
        <Wire points={[[x0 - 12, P_Y], [x0 - 12, 210]]} color={c.L} title="Phase vers interrupteur" />
        <Wire points={[[x0 + 12, 210], [x0 + 12, 250], [x0 + 76, 250], [x0 + 76, 150]]} color={c.C} title="Retour interrupteur" />
        <Wire points={[[x0 + 96, N_Y], [x0 + 96, 150]]} color={c.N} title="Neutre" />
        <Wire points={[[x0 + 116, E_Y], [x0 + 116, 150]]} earth title="Terre" />
        <DeviceBox x={x0 - 24} y={160} w={48} h={50} label={`S${i + 1}`} sublabel="Interrupteur">
          <SwitchGlyph x={x0 - 24} y={160} w={48} h={50} />
        </DeviceBox>
        <Terminal x={x0 - 12} y={210} label="L" />
        <Terminal x={x0 + 12} y={210} label="↑" />
        <DeviceBox x={x0 + 60} y={90} w={72} h={60} label={target === 'LAMP' ? 'Point lumineux (DCL)' : 'Prise commandée'}>
          {target === 'LAMP' ? <LampGlyph cx={x0 + 96} cy={116} /> : <SocketGlyph cx={x0 + 96} cy={116} />}
        </DeviceBox>
        <Terminal x={x0 + 76} y={150} label="L" />
        <Terminal x={x0 + 96} y={150} label="N" />
        <Terminal x={x0 + 116} y={150} label="⏚" />
        <WireLabel x={x0 + 44} y={245} text="retour" color={c.C} />
      </g>,
    );
    drops.L.push(x0 - 12);
    drops.N.push(x0 + 96);
    drops.PE.push(x0 + 116);
  }
  const more = circuit.points - shown;
  return {
    body,
    drops,
    footnote: more > 0 ? `… et ${more} autre${more > 1 ? 's' : ''} point${more > 1 ? 's' : ''} câblé${more > 1 ? 's' : ''} à l’identique sur ce circuit.` : undefined,
  };
}

function twoWay(circuit: Circuit, c: Colors): Field {
  const x0 = 340;
  const x2 = 640;
  const xl = 780;
  const body = (
    <g>
      <Wire points={[[x0 - 12, 170], [x0 - 12, 128], [x2 + 12, 128], [x2 + 12, 170]]} color={c.T1} title="Navette 1" />
      <Wire points={[[x0 + 12, 170], [x0 + 12, 144], [x2 - 12, 144], [x2 - 12, 170]]} color={c.T2} title="Navette 2" />
      <Wire points={[[x0, P_Y], [x0, 226]]} color={c.L} title="Phase vers commun S1" />
      <Wire points={[[x2, 226], [x2, 262], [xl - 20, 262], [xl - 20, 180]]} color={c.R} title="Retour lampe" />
      <Wire points={[[xl, N_Y], [xl, 180]]} color={c.N} title="Neutre" />
      <Wire points={[[xl + 20, E_Y], [xl + 20, 180]]} earth title="Terre" />
      <DeviceBox x={x0 - 26} y={170} w={52} h={56} label="S1" sublabel="va-et-vient" labelPos="left">
        <TwoWayGlyph x={x0 - 26} y={170} w={52} h={56} />
      </DeviceBox>
      <DeviceBox x={x2 - 26} y={170} w={52} h={56} label="S2" sublabel="va-et-vient" labelPos="left">
        <TwoWayGlyph x={x2 - 26} y={170} w={52} h={56} />
      </DeviceBox>
      {[x0, x2].map((x) => (
        <g key={x}>
          <Terminal x={x - 12} y={170} label="1" position="above" />
          <Terminal x={x + 12} y={170} label="2" position="above" />
          <Terminal x={x} y={226} label="C" />
        </g>
      ))}
      <DeviceBox x={xl - 34} y={120} w={68} h={60} label="Point lumineux">
        <LampGlyph cx={xl} cy={146} />
      </DeviceBox>
      <Terminal x={xl - 20} y={180} label="L" />
      <Terminal x={xl} y={180} label="N" />
      <Terminal x={xl + 20} y={180} label="⏚" />
      <WireLabel x={(x0 + x2) / 2} y={122} text="Navette 1 (orange)" color={c.T1} />
      <WireLabel x={(x0 + x2) / 2} y={158} text="Navette 2 (violet)" color={c.T2} />
      <WireLabel x={x2 + 66} y={256} text="retour lampe" color={c.R} />
      <WireLabel x={x0 + 8} y={252} text="phase → commun" color={c.L} anchor="start" />
    </g>
  );
  return {
    body,
    drops: { L: [x0], N: [xl], PE: [xl + 20] },
    footnote:
      circuit.points > 1
        ? `${circuit.points} installations va-et-vient identiques sur ce circuit (8 points max).`
        : undefined,
  };
}

function remoteSwitch(circuit: Circuit, c: Colors): Field {
  const shown = Math.min(circuit.pushButtons, 3);
  const xs = Array.from({ length: shown }, (_, j) => 340 + j * 120);
  const xl = 340 + shown * 120 + 60;
  const lastP = xs[xs.length - 1] ?? 340;
  const aux = (
    <g>
      <Wire points={[[BL, 250], [AUX.a1, 250], [AUX.a1, AUX.y + AUX.h]]} color={c.L} title="Phase vers contact du télérupteur" />
      <Wire points={[[AUX.a2, AUX.y], [AUX.a2, 124], [258, 124], [258, N_Y]]} color={c.N} title="Neutre bobine (A2)" />
      <Wire points={[[AUX.a1, AUX.y], [AUX.a1, 110], [lastP, 110]]} color={c.C} title="Retour commande (A1)" />
      <Wire points={[[AUX.a2, AUX.y + AUX.h], [AUX.a2, 272], [xl - 20, 272], [xl - 20, 180]]} color={c.R} title="Sortie lampe" />
      <Module x={AUX.x} y={AUX.y} w={AUX.w} h={AUX.h} title="TL" subtitle="16 A" accent="#0ea5e9" />
      <Terminal x={AUX.a1} y={AUX.y} label="A1" position="above" />
      <Terminal x={AUX.a2} y={AUX.y} label="A2" position="above" />
      <Terminal x={AUX.a1} y={AUX.y + AUX.h} label="1" />
      <Terminal x={AUX.a2} y={AUX.y + AUX.h} label="2" />
      <Junction x={BL} y={250} color={c.L} />
      <Junction x={258} y={N_Y} color={c.N} />
    </g>
  );
  const body = (
    <g>
      {xs.map((xp, j) => (
        <g key={xp}>
          <Wire points={[[xp, P_Y], [xp, 198]]} color={c.L} title="Phase vers poussoir" />
          <Wire points={[[xp, 150], [xp, 110]]} color={c.C} title="Retour commande" />
          {j < xs.length - 1 && <Junction x={xp} y={110} color={c.C} />}
          <DeviceBox x={xp - 22} y={150} w={44} h={48} label={`BP${j + 1}`} labelPos="left">
            <PushGlyph x={xp - 22} y={150} w={44} h={48} />
          </DeviceBox>
          <Terminal x={xp} y={150} label="↑" position="above" />
          <Terminal x={xp} y={198} label="L" />
        </g>
      ))}
      <Wire points={[[xl, N_Y], [xl, 180]]} color={c.N} title="Neutre" />
      <Wire points={[[xl + 20, E_Y], [xl + 20, 180]]} earth title="Terre" />
      <DeviceBox x={xl - 34} y={120} w={68} h={60} label="Point lumineux">
        <LampGlyph cx={xl} cy={146} />
      </DeviceBox>
      <Terminal x={xl - 20} y={180} label="L" />
      <Terminal x={xl} y={180} label="N" />
      <Terminal x={xl + 20} y={180} label="⏚" />
      <WireLabel x={300} y={104} text="commande des poussoirs → bobine A1" color={c.C} anchor="start" />
      <WireLabel x={xl - 30} y={268} text="sortie lampe" color={c.R} anchor="end" />
    </g>
  );
  const notes: string[] = [];
  if (circuit.pushButtons > shown) notes.push(`${circuit.pushButtons} poussoirs en parallèle (3 représentés)`);
  if (circuit.points > 1) notes.push(`${circuit.points} télérupteurs sur ce circuit`);
  return {
    body,
    aux,
    drops: { L: xs, N: [xl], PE: [xl + 20] },
    footnote: notes.length ? `${notes.join(' · ')}.` : undefined,
  };
}

function sockets(circuit: Circuit, c: Colors): Field {
  const shown = Math.min(circuit.points, 4);
  const xs = Array.from({ length: shown }, (_, k) => 350 + k * 135);
  const outdoor = circuit.roomCategory === 'OUTDOOR';
  const body = (
    <g>
      {xs.map((x, k) => (
        <g key={x}>
          <Wire points={[[x - 16, P_Y], [x - 16, 204]]} color={c.L} />
          <Wire points={[[x + 16, N_Y], [x + 16, 204]]} color={c.N} />
          <Wire points={[[x, E_Y], [x, 204]]} earth />
          <DeviceBox x={x - 30} y={140} w={60} h={64} label={`Prise ${k + 1}`} sublabel={outdoor ? 'IP44+' : '16 A 2P+T'}>
            <SocketGlyph cx={x} cy={168} />
          </DeviceBox>
          <Terminal x={x - 16} y={204} label="L" />
          <Terminal x={x} y={204} label="⏚" />
          <Terminal x={x + 16} y={204} label="N" />
        </g>
      ))}
    </g>
  );
  const more = circuit.points - shown;
  return {
    body,
    drops: { L: xs.map((x) => x - 16), N: xs.map((x) => x + 16), PE: xs },
    footnote:
      more > 0
        ? `… et ${more} prise${more > 1 ? 's' : ''} supplémentaire${more > 1 ? 's' : ''} (repiquage par bornes doubles ou dérivation par bornes à levier).`
        : 'Les prises sont alimentées en repiquage (bornes doubles) ou par dérivation avec bornes à levier.',
  };
}

function loadLabel(circuit: Circuit): { title: string; sub: string; icon: string } {
  switch (circuit.type) {
    case 'DEDICATED_20A':
      return { title: circuit.appliance ? APPLIANCE_LABELS[circuit.appliance] : 'Appareil', sub: 'Prise 16 A 2P+T dédiée', icon: '⎓' };
    case 'COOKTOP_32A':
      return { title: 'Plaque de cuisson', sub: 'Sortie de câble 32 A', icon: '◎' };
    case 'WATER_HEATER':
      return { title: 'Chauffe-eau', sub: 'Sortie de câble · asservi HC', icon: '♨' };
    case 'HEAT_PUMP_AC':
      return { title: 'PAC / Climatisation', sub: 'Unité extérieure (variateur)', icon: '❄' };
    case 'IRVE_CHARGER':
      return {
        title: circuit.irvePower ? IRVE_LABELS[circuit.irvePower] : 'Borne IRVE',
        sub: circuit.irvePower === 'REINFORCED_3_7KW' ? 'Mode 2 · obturateurs' : 'Mode 3 · prise Type 2',
        icon: '⚡',
      };
    default:
      return { title: circuit.name, sub: '', icon: '' };
  }
}

function singleLoad(circuit: Circuit, c: Colors): Field {
  const { title, sub, icon } = loadLabel(circuit);
  const isWh = circuit.type === 'WATER_HEATER';
  const body = (
    <g>
      <Wire points={[[620, P_Y], [620, 220]]} color={c.L} />
      <Wire points={[[670, N_Y], [670, 220]]} color={c.N} />
      <Wire points={[[720, E_Y], [720, 220]]} earth />
      <DeviceBox x={560} y={110} w={220} h={110} label={title} sublabel={sub}>
        <text x={670} y={175} fontSize={40} textAnchor="middle" fill={INK} opacity={0.85}>
          {icon}
        </text>
      </DeviceBox>
      <Terminal x={620} y={220} label="L" />
      <Terminal x={670} y={220} label="N" />
      <Terminal x={720} y={220} label="⏚" />
      {isWh && (
        <g>
          <rect x={300} y={78} width={196} height={34} rx={6} fill={PAPER} stroke={c.C} strokeDasharray="4 4" />
          <text x={398} y={92} fontSize={9} fontWeight={700} textAnchor="middle" fill={INK}>
            Contact heures creuses
          </text>
          <text x={398} y={104} fontSize={8.5} textAnchor="middle" fill={MUTED}>
            compteur, bornes C1 / C2
          </text>
        </g>
      )}
    </g>
  );
  const aux = isWh ? (
    <g>
      <Wire points={[[BL, 224], [BL, 250], [AUX.a1, 250], [AUX.a1, AUX.y + AUX.h]]} color={c.L} title="Phase vers contacteur" />
      <Wire points={[[AUX.a2, AUX.y], [AUX.a2, 124], [258, 124], [258, N_Y]]} color={c.N} title="Neutre bobine (A2)" />
      <Wire points={[[AUX.a1, AUX.y], [AUX.a1, 95], [300, 95]]} color={c.C} dashed title="Commande HC (A1)" />
      <Module x={AUX.x} y={AUX.y} w={AUX.w} h={AUX.h} title="KM" subtitle="20 A HC" accent="#8b5cf6" />
      <Terminal x={AUX.a1} y={AUX.y} label="A1" position="above" />
      <Terminal x={AUX.a2} y={AUX.y} label="A2" position="above" />
      <Terminal x={AUX.a1} y={AUX.y + AUX.h} label="1" />
      <Terminal x={AUX.a2} y={AUX.y + AUX.h} label="2" />
      <Junction x={258} y={N_Y} color={c.N} />
    </g>
  ) : undefined;
  return {
    body,
    aux,
    phaseViaContactor: isWh,
    drops: { L: [620], N: [670], PE: [720] },
    footnote:
      circuit.type === 'IRVE_CHARGER'
        ? 'Point de recharge protégé par son propre dispositif différentiel 30 mA.'
        : circuit.type === 'HEAT_PUMP_AC'
          ? 'Prévoir un interrupteur-sectionneur de proximité près de l’unité extérieure.'
          : isWh
            ? 'Bobine du contacteur commandée par le contact heures creuses du compteur ; position marche forcée disponible.'
            : undefined,
  };
}

function fieldFor(circuit: Circuit, c: Colors): Field {
  switch (circuit.type) {
    case 'LIGHTING_SIMPLE':
      return simplePoints(circuit, c, 'LAMP');
    case 'SOCKET_SWITCHED':
      return simplePoints(circuit, c, 'SOCKET');
    case 'LIGHTING_TWO_WAY':
      return twoWay(circuit, c);
    case 'LIGHTING_REMOTE_SWITCH':
      return remoteSwitch(circuit, c);
    case 'SOCKET_16A':
      return sockets(circuit, c);
    default:
      return singleLoad(circuit, c);
  }
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CircuitDiagram({
  circuit,
  group,
  phaseColor,
  idPrefix = 'cd',
}: {
  circuit: Circuit;
  group?: DifferentialGroup;
  phaseColor: PhaseColor;
  idPrefix?: string;
}) {
  const c = colors(phaseColor);
  const f = fieldFor(circuit, c);
  const spec = circuit.spec;
  const endL = Math.max(...f.drops.L);
  const endN = Math.max(...f.drops.N);
  const endPE = Math.max(...f.drops.PE);
  const phaseStartX = f.phaseViaContactor ? AUX.a2 : BL;
  const phaseStartY = f.phaseViaContactor ? AUX.y + AUX.h : 224;
  const pose =
    spec.installation === 'CABLE' ? `Câble ${spec.cableDesignation ?? ''}` : `Fils H07V-U · gaine ICTA ${spec.ictaDiameter.replace('mm', ' mm')}`;
  const gridId = `${idPrefix}-grid-${circuit.id.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Schéma multifilaire du circuit ${circuit.ref} — ${circuit.name}`}
      fontFamily="Inter, system-ui, sans-serif"
    >
      <defs>
        <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="#cbd5e1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={PAPER} />
      <rect width={W} height={H} fill={`url(#${gridId})`} />

      {/* Tableau */}
      <rect x={16} y={28} width={250} height={380} rx={12} fill="#f1f5f9" stroke="#94a3b8" strokeDasharray="6 4" />
      <text x={30} y={46} fontSize={10} fontWeight={800} fill={MUTED} letterSpacing={1.5}>
        TABLEAU
      </text>
      <Wire points={[[BL, 8], [BL, 52]]} color={c.L} />
      <Wire points={[[BN, 8], [BN, 52]]} color={c.N} />
      <text x={124} y={20} fontSize={8.5} fill={MUTED}>
        depuis AGCP (peigne)
      </text>
      <Module x={36} y={52} w={120} h={60} title={`${group?.ref ?? 'ID'} · 30 mA`} subtitle={`${group?.rating ?? ''} ${spec.differentialType}`} accent={DIFF_ACCENT[spec.differentialType]} />
      <Terminal x={BL} y={112} />
      <Terminal x={BN} y={112} />
      <Wire points={[[BL, 112], [BL, 140]]} color={c.L} />
      <Wire points={[[BN, 112], [BN, 140]]} color={c.N} />
      <Module
        x={56}
        y={140}
        w={80}
        h={84}
        title={circuit.ref}
        subtitle={`${spec.breakerRating}${spec.requiresAfci ? ' + DDA' : ''} · C`}
        accent={c.L}
      />
      <Terminal x={BL} y={224} label="L" />
      <Terminal x={BN} y={224} label="N" />
      <rect x={40} y={388} width={200} height={10} rx={3} fill={WIRE_COLORS.EARTH_GREEN} />
      <text x={44} y={383} fontSize={8.5} fill={MUTED}>
        Bornier de terre
      </text>

      {f.aux}

      {/* Barres de distribution */}
      <Wire points={[[BN, 224], [BN, N_Y], [endN, N_Y]]} color={c.N} title="Neutre" />
      {f.phaseViaContactor ? (
        <Wire points={[[phaseStartX, phaseStartY], [phaseStartX, P_Y], [endL, P_Y]]} color={c.L} title="Phase" />
      ) : (
        <Wire points={[[BL, 224], [BL, P_Y], [endL, P_Y]]} color={c.L} title="Phase" />
      )}
      <Wire points={[[230, 388], [230, E_Y], [endPE, E_Y]]} earth title="Terre" />
      <text x={272} y={N_Y - 5} fontSize={9} fontWeight={800} fill={c.N}>
        N
      </text>
      <text x={272} y={P_Y - 5} fontSize={9} fontWeight={800} fill={c.L}>
        L
      </text>
      <text x={272} y={E_Y - 5} fontSize={9} fontWeight={800} fill={WIRE_COLORS.EARTH_GREEN}>
        PE
      </text>

      {f.body}

      {f.drops.L.filter((x) => x !== endL).map((x) => (
        <Junction key={`l${x}`} x={x} y={P_Y} color={c.L} />
      ))}
      {f.drops.N.filter((x) => x !== endN).map((x) => (
        <Junction key={`n${x}`} x={x} y={N_Y} color={c.N} />
      ))}
      {f.drops.PE.filter((x) => x !== endPE).map((x) => (
        <Junction key={`e${x}`} x={x} y={E_Y} color={WIRE_COLORS.EARTH_GREEN} />
      ))}

      {/* En-tête */}
      <text x={290} y={40} fontSize={15} fontWeight={800} fill={INK}>
        {circuit.ref} — {circuit.name}
      </text>
      <text x={290} y={58} fontSize={10} fill={MUTED} fontWeight={500}>
        {formatSection(spec.wireSection)} · Disjoncteur {spec.breakerRating} · ID 30 mA {spec.differentialType} · {pose}
      </text>

      {f.footnote && (
        <text x={290} y={400} fontSize={9.5} fill={MUTED} fontStyle="italic">
          {f.footnote}
        </text>
      )}
    </svg>
  );
}
