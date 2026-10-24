/**
 * ElecGuide — Moteur de règles NF C 15-100
 *
 * Référentiel : série NF C 15-100 révisée (publiée le 23/08/2024, applicable aux
 * installations neuves et rénovations depuis septembre 2025), habitat, monophasé 230 V.
 *
 * Principales règles intégrées :
 *  - Éclairage : 1,5 mm², 16 A, 8 points max par circuit.
 *  - Prises 16 A : 8 max en 1,5 mm² / 16 A, 12 max en 2,5 mm² / 20 A.
 *  - Circuits spécialisés 20 A (four, lave-linge, lave-vaisselle) : 2,5 mm², 1 appareil par circuit.
 *  - Plaques de cuisson : 6 mm², 32 A, ID Type A.
 *  - Lave-linge / plaques : ID 30 mA Type A obligatoire ; au moins un ID Type A par logement.
 *  - Équipements à variateur de vitesse (PAC, clim) : ID 30 mA Type F.
 *  - IRVE : circuit dédié, DDR 30 mA dédié (Type A ou F en monophasé, Type B en triphasé) ;
 *    3,7 kW → 2,5 mm² / 20 A ; 7,4 kW → 10 mm² / 40 A (16 mm² au-delà de 30 m).
 *  - 8 circuits max par interrupteur différentiel 30 mA.
 *  - Chute de tension : 3 % éclairage, 5 % autres usages (alimentation par réseau public BT).
 *  - Réserve de 20 % au tableau.
 *
 * ⚠ Outil d'aide à la conception : ne remplace ni la norme, ni la notice des fabricants,
 *   ni l'avis d'un électricien qualifié / l'attestation Consuel.
 */

import type {
  BomCategory,
  BomLine,
  BreakerRating,
  Circuit,
  CircuitType,
  DifferentialGroup,
  DifferentialRating,
  DifferentialType,
  IctaDiameter,
  InstallationResult,
  ProjectSettings,
  SelectedComponent,
  WireRole,
  WireSection,
  WireSpec,
  WiringSpecification,
} from '../types/electrical';
import { APPLIANCE_LABELS, IRVE_LABELS } from './catalog';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes normatives & physiques
// ─────────────────────────────────────────────────────────────────────────────

export const NORM_REFERENCE =
  'NF C 15-100 — série révisée publiée le 23/08/2024, applicable depuis septembre 2025';

/** Résistivité du cuivre en service (Ω·mm²/m), valeur usuelle pour le calcul de chute de tension */
export const RHO_COPPER = 0.0225;
export const NOMINAL_VOLTAGE = 230;
export const MAX_DROP_LIGHTING = 3;
export const MAX_DROP_OTHER = 5;
export const MAX_CIRCUITS_PER_RCD = 8;
export const MAX_LIGHT_POINTS_PER_CIRCUIT = 8;
export const MAX_SOCKETS_PER_CIRCUIT: Record<'1.5mm²' | '2.5mm²', number> = {
  '1.5mm²': 8,
  '2.5mm²': 12,
};
export const IRVE_WALLBOX_LONG_RUN_M = 30;
/** Marge de chute / raccordement appliquée aux longueurs de conducteurs */
export const WIRE_MARGIN = 1.1;
/** Longueur moyenne d'une descente vers une commande (interrupteur, poussoir) */
export const SWITCH_DROP_M = 2.5;
export const BOARD_MODULES_PER_ROW = 13;
export const BOARD_RESERVE = 0.2;
export const WAGO_ITEM = 'Bornes de connexion à levier Wago 221 (2 à 5 entrées)';
export const WAGO_LOT_SIZE = 50;

export const WIRE_COLORS = {
  PHASE_RED: '#d32f2f',
  PHASE_BROWN: '#8d5524',
  NEUTRAL: '#42a5f5',
  EARTH_GREEN: '#2e9d4a',
  EARTH_YELLOW: '#f5c400',
  ORANGE: '#f57c00',
  VIOLET: '#7e57c2',
  BLACK: '#212121',
} as const;

const LIGHTING_FAMILY: CircuitType[] = ['LIGHTING_SIMPLE', 'LIGHTING_TWO_WAY', 'LIGHTING_REMOTE_SWITCH'];
const LIGHTING_LIKE: CircuitType[] = [...LIGHTING_FAMILY, 'SOCKET_SWITCHED'];
const AFCI_ELIGIBLE: CircuitType[] = [...LIGHTING_LIKE, 'SOCKET_16A'];

export const DEFAULT_SETTINGS: ProjectSettings = {
  lightningRisk: 'STANDARD',
  includeSurgeProtector: true,
  afci: false,
  typeAEverywhere: false,
  phaseColor: 'RED',
};

// ─────────────────────────────────────────────────────────────────────────────
// Utilitaires
// ─────────────────────────────────────────────────────────────────────────────

export function sectionValue(section: WireSection): number {
  return parseFloat(section);
}

/** Section au format français : « 2,5 mm² » */
export function formatSection(section: WireSection): string {
  return `${String(sectionValue(section)).replace('.', ',')} mm²`;
}

/** Chute de tension en monophasé (cos φ ≈ 1) : ΔU = 2·ρ·L·I / S, exprimée en % de 230 V */
export function voltageDropPercent(lengthM: number, currentA: number, section: WireSection): number {
  const du = (2 * RHO_COPPER * lengthM * currentA) / sectionValue(section);
  return Math.round((du / NOMINAL_VOLTAGE) * 1000) / 10;
}

export function ictaFor(section: WireSection, conductors: number): IctaDiameter {
  switch (section) {
    case '1.5mm²':
      return conductors <= 3 ? 'Ø16mm' : 'Ø20mm';
    case '2.5mm²':
      return conductors <= 3 ? 'Ø20mm' : 'Ø25mm';
    case '6mm²':
      return 'Ø25mm';
    default:
      return 'Ø32mm';
  }
}

/** Répartit `total` éléments en lots de taille ≤ `max`, de façon équilibrée */
export function splitBalanced(total: number, max: number): number[] {
  if (total <= 0) return [];
  const count = Math.ceil(total / max);
  const base = Math.floor(total / count);
  const extra = total % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

function chunkBalanced<T>(items: T[], max: number): T[][] {
  const sizes = splitBalanced(items.length, max);
  const out: T[][] = [];
  let cursor = 0;
  for (const size of sizes) {
    out.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return out;
}

function breakerAmps(rating: BreakerRating): number {
  return parseInt(rating, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// Règles de base par type de circuit (tableau §3 du cahier des charges)
// ─────────────────────────────────────────────────────────────────────────────

interface BaseRule {
  wireSection: WireSection;
  breakerRating: BreakerRating;
  differentialType: DifferentialType;
  maxDrop: number;
}

export function getBaseRule(component: Pick<SelectedComponent, 'type' | 'socketSection' | 'irvePower'>): BaseRule {
  switch (component.type) {
    case 'LIGHTING_SIMPLE':
    case 'LIGHTING_TWO_WAY':
    case 'LIGHTING_REMOTE_SWITCH':
      return { wireSection: '1.5mm²', breakerRating: '16A', differentialType: 'Type AC', maxDrop: MAX_DROP_LIGHTING };
    case 'SOCKET_SWITCHED':
      return { wireSection: '1.5mm²', breakerRating: '16A', differentialType: 'Type AC', maxDrop: MAX_DROP_OTHER };
    case 'SOCKET_16A':
      return component.socketSection === '1.5mm²'
        ? { wireSection: '1.5mm²', breakerRating: '16A', differentialType: 'Type AC', maxDrop: MAX_DROP_OTHER }
        : { wireSection: '2.5mm²', breakerRating: '20A', differentialType: 'Type AC', maxDrop: MAX_DROP_OTHER };
    case 'DEDICATED_20A':
      return { wireSection: '2.5mm²', breakerRating: '20A', differentialType: 'Type A', maxDrop: MAX_DROP_OTHER };
    case 'COOKTOP_32A':
      return { wireSection: '6mm²', breakerRating: '32A', differentialType: 'Type A', maxDrop: MAX_DROP_OTHER };
    case 'WATER_HEATER':
      return { wireSection: '2.5mm²', breakerRating: '20A', differentialType: 'Type AC', maxDrop: MAX_DROP_OTHER };
    case 'HEAT_PUMP_AC':
      return { wireSection: '2.5mm²', breakerRating: '20A', differentialType: 'Type F', maxDrop: MAX_DROP_OTHER };
    case 'IRVE_CHARGER':
      return component.irvePower === 'REINFORCED_3_7KW'
        ? { wireSection: '2.5mm²', breakerRating: '20A', differentialType: 'Type A', maxDrop: MAX_DROP_OTHER }
        : { wireSection: '10mm²', breakerRating: '40A', differentialType: 'Type A', maxDrop: MAX_DROP_OTHER };
  }
}

/** Courant d'emploi retenu pour la chute de tension */
function designCurrent(type: CircuitType, rating: BreakerRating, points: number, irvePower?: string): number {
  switch (type) {
    case 'LIGHTING_SIMPLE':
    case 'LIGHTING_TWO_WAY':
    case 'LIGHTING_REMOTE_SWITCH':
      // ≈ 100 W par point (LED largement en dessous), plafonné au calibre
      return Math.min(breakerAmps(rating), Math.max(1, Math.round(points * 0.45 * 10) / 10));
    case 'SOCKET_16A':
    case 'SOCKET_SWITCHED':
      return 16;
    case 'IRVE_CHARGER':
      return irvePower === 'REINFORCED_3_7KW' ? 16 : 32;
    default:
      return breakerAmps(rating);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conducteurs
// ─────────────────────────────────────────────────────────────────────────────

function phaseColor(settings: ProjectSettings): { color: string; name: string } {
  return settings.phaseColor === 'BROWN'
    ? { color: WIRE_COLORS.PHASE_BROWN, name: 'Marron' }
    : { color: WIRE_COLORS.PHASE_RED, name: 'Rouge' };
}

function makeWire(role: WireRole, section: WireSection, settings: ProjectSettings): WireSpec {
  const gauge = formatSection(section);
  const phase = phaseColor(settings);
  switch (role) {
    case 'PHASE':
      return { role, color: phase.color, colorName: phase.name, label: 'Phase (L)', gauge };
    case 'NEUTRAL':
      return { role, color: WIRE_COLORS.NEUTRAL, colorName: 'Bleu clair', label: 'Neutre (N)', gauge };
    case 'EARTH':
      return { role, color: WIRE_COLORS.EARTH_GREEN, colorName: 'Vert/Jaune', label: 'Terre (PE)', gauge };
    case 'TRAVELER_1':
      return { role, color: WIRE_COLORS.ORANGE, colorName: 'Orange', label: 'Navette 1', gauge };
    case 'TRAVELER_2':
      return { role, color: WIRE_COLORS.VIOLET, colorName: 'Violet', label: 'Navette 2', gauge };
    case 'RETURN':
      return { role, color: WIRE_COLORS.BLACK, colorName: 'Noir', label: 'Retour lampe', gauge };
    case 'CONTROL':
      return { role, color: WIRE_COLORS.ORANGE, colorName: 'Orange', label: 'Retour / commande', gauge };
  }
}

function wireRolesFor(type: CircuitType): WireRole[] {
  switch (type) {
    case 'LIGHTING_SIMPLE':
    case 'SOCKET_SWITCHED':
      return ['PHASE', 'NEUTRAL', 'EARTH', 'CONTROL'];
    case 'LIGHTING_TWO_WAY':
      return ['PHASE', 'NEUTRAL', 'EARTH', 'TRAVELER_1', 'TRAVELER_2', 'RETURN'];
    case 'LIGHTING_REMOTE_SWITCH':
      return ['PHASE', 'NEUTRAL', 'EARTH', 'CONTROL', 'RETURN'];
    default:
      return ['PHASE', 'NEUTRAL', 'EARTH'];
  }
}

/** Nombre de conducteurs sur la ligne principale (tableau → points) */
function mainRunConductors(type: CircuitType): number {
  return type === 'LIGHTING_REMOTE_SWITCH' ? 5 : 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spécification d'un circuit
// ─────────────────────────────────────────────────────────────────────────────

export interface CircuitInput {
  type: CircuitType;
  roomCategory: SelectedComponent['roomCategory'];
  points: number;
  lengthM: number;
  pushButtons?: number;
  appliance?: SelectedComponent['appliance'];
  irvePower?: SelectedComponent['irvePower'];
  socketSection?: SelectedComponent['socketSection'];
}

export function buildWiringSpecification(input: CircuitInput, settings: ProjectSettings): WiringSpecification {
  const base = getBaseRule(input);
  const notes: string[] = [];
  const warnings: string[] = [];
  const lengthM = Math.max(1, input.lengthM);
  const points = Math.max(1, input.points);
  const pushButtons = Math.max(2, input.pushButtons ?? 3);

  let wireSection = base.wireSection;
  const breakerRating = base.breakerRating;
  let differentialType = base.differentialType;
  if (settings.typeAEverywhere && differentialType === 'Type AC') differentialType = 'Type A';

  // — IRVE : section selon la longueur (7,4 kW → 16 mm² au-delà de 30 m)
  if (input.type === 'IRVE_CHARGER' && input.irvePower !== 'REINFORCED_3_7KW' && lengthM > IRVE_WALLBOX_LONG_RUN_M) {
    wireSection = '16mm²';
    notes.push(`Ligne > ${IRVE_WALLBOX_LONG_RUN_M} m : section portée à 16 mm² pour limiter la chute de tension.`);
  }

  // — Chute de tension
  const current = designCurrent(input.type, breakerRating, points, input.irvePower);
  let drop = voltageDropPercent(lengthM, current, wireSection);
  if (drop > base.maxDrop) {
    const upsized = upsize(input.type, wireSection);
    if (upsized) {
      const upsizedDrop = voltageDropPercent(lengthM, current, upsized);
      notes.push(
        `Chute de tension ${fmtPct(drop)} > ${base.maxDrop} % en ${formatSection(wireSection)} : section portée à ${formatSection(upsized)} (${fmtPct(upsizedDrop)}).`,
      );
      wireSection = upsized;
      drop = upsizedDrop;
    }
  }
  if (drop > base.maxDrop) {
    warnings.push(
      LIGHTING_FAMILY.includes(input.type)
        ? `Chute de tension estimée ${fmtPct(drop)} > ${base.maxDrop} % : rapprocher les points du tableau ou scinder le circuit.`
        : `Chute de tension estimée ${fmtPct(drop)} > ${base.maxDrop} % : réduire la longueur ou augmenter la section (à faire valider par un professionnel).`,
    );
  }

  // — Mode de pose
  const outdoor = input.roomCategory === 'OUTDOOR';
  const cableMode = outdoor || input.type === 'IRVE_CHARGER';
  const conductors = mainRunConductors(input.type);
  const ictaDiameter = ictaFor(wireSection, conductors);
  const cableDesignation = cableMode ? `U1000 R2V ${conductors}G${String(sectionValue(wireSection)).replace('.', ',')}` : undefined;

  // — Notes normatives par type
  notes.push(...typeNotes(input));
  if (input.roomCategory === 'WET') {
    notes.push(
      'Pièce d’eau : respecter les volumes 0, 1 et 2 (aucune prise ni interrupteur dans ces volumes, hors matériel TBTS et prise rasoir à transformateur de séparation en volume 2) ; liaison équipotentielle supplémentaire.',
    );
  }
  if (outdoor) {
    notes.push(
      'Extérieur : appareillage IP44 minimum (IP55 recommandé). Câble enterré U1000 R2V sous fourreau TPC rouge, à 50 cm de profondeur minimum (85 cm sous passage de véhicules), grillage avertisseur rouge à environ 20 cm au-dessus.',
    );
  }

  // — Dispositifs complémentaires
  const requiresAfci = settings.afci && AFCI_ELIGIBLE.includes(input.type);
  const requiresSurgeProtector = settings.lightningRisk === 'HIGH';

  const wires = wireRolesFor(input.type).map((role) => makeWire(role, wireSection, settings));

  const spec: WiringSpecification = {
    circuitType: input.type,
    wireSection,
    breakerRating,
    differentialType,
    ictaDiameter,
    requiresAfci,
    requiresSurgeProtector,
    wires,
    billOfMaterials: [],
    installation: cableMode ? 'CABLE' : 'WIRES_IN_CONDUIT',
    cableDesignation,
    designCurrentA: current,
    voltageDropPercent: drop,
    maxVoltageDropPercent: base.maxDrop,
    notes,
    warnings,
  };
  spec.billOfMaterials = circuitBom(input, spec, settings, { lengthM, points, pushButtons });
  return spec;
}

function upsize(type: CircuitType, section: WireSection): WireSection | null {
  if (type === 'COOKTOP_32A' && section === '6mm²') return '10mm²';
  if (type === 'IRVE_CHARGER' && section === '2.5mm²') return '6mm²';
  if (type === 'IRVE_CHARGER' && section === '10mm²') return '16mm²';
  return null;
}

function fmtPct(v: number): string {
  return `${String(v).replace('.', ',')} %`;
}

function typeNotes(input: CircuitInput): string[] {
  switch (input.type) {
    case 'LIGHTING_SIMPLE':
      return ['8 points lumineux maximum par circuit. Point de centre équipé d’une boîte et d’une douille DCL.'];
    case 'LIGHTING_TWO_WAY':
      return [
        'Va-et-vient : la phase arrive sur le commun du 1ᵉʳ interrupteur, les deux navettes relient les interrupteurs, le commun du 2ᵉ repart vers la lampe.',
        '8 points lumineux maximum par circuit.',
      ];
    case 'LIGHTING_REMOTE_SWITCH':
      return [
        'Télérupteur modulaire au tableau : poussoirs câblés en parallèle sur la bobine (A1/A2), contact de puissance vers le point lumineux.',
        'Solution recommandée au-delà de 2 points de commande.',
      ];
    case 'SOCKET_16A':
      return [
        input.socketSection === '1.5mm²'
          ? '1,5 mm² protégé par 16 A : 8 prises maximum par circuit.'
          : '2,5 mm² protégé par 20 A : 12 prises maximum par circuit.',
        'Prises 2P+T à obturateurs (éclipses) obligatoires. Un socle double compte pour 2 prises.',
      ];
    case 'SOCKET_SWITCHED':
      return ['Prise commandée par interrupteur, alimentée par un circuit 1,5 mm² / 16 A (comptée comme un point d’éclairage).'];
    case 'DEDICATED_20A': {
      const name = input.appliance ? APPLIANCE_LABELS[input.appliance] : 'Appareil';
      const notes = [`Circuit spécialisé ${name} : un seul appareil par circuit, prise 16 A 2P+T dédiée.`];
      if (input.appliance === 'WASHING_MACHINE') notes.push('Lave-linge : protection par ID 30 mA Type A obligatoire.');
      else notes.push('Protection par ID 30 mA Type A (cahier des charges ElecGuide).');
      return notes;
    }
    case 'COOKTOP_32A':
      return [
        'Circuit spécialisé cuisson 32 A monophasé (sortie de câble ou prise 32 A), protégé par un ID 30 mA Type A obligatoire.',
        'En triphasé : 5G2,5 mm² sous 20 A — non couvert par ce calcul.',
      ];
    case 'WATER_HEATER':
      return [
        'Chauffe-eau asservi aux heures creuses par contacteur jour/nuit (bobine commandée par le contact sec C1/C2 du compteur).',
        'Puissance du chauffe-eau ≤ 3 500 W pour un circuit 2,5 mm² / 20 A.',
      ];
    case 'HEAT_PUMP_AC':
      return [
        'ID 30 mA Type F exigé en tête des circuits alimentant des équipements à variateur de vitesse (PAC, climatisation) — révision 2024. Évite les déclenchements intempestifs.',
        'Calibre (16 A ou 20 A) et section à confirmer avec la notice du fabricant. Prévoir un interrupteur-sectionneur de proximité près de l’unité extérieure.',
      ];
    case 'IRVE_CHARGER':
      return input.irvePower === 'REINFORCED_3_7KW'
        ? [
            'Prise renforcée 3,7 kW (Mode 2) : circuit dédié 2,5 mm² protégé par disjoncteur 20 A, à obturateurs de sécurité.',
            'DDR 30 mA dédié au point de recharge : Type A ou F en monophasé (Type B en triphasé).',
          ]
        : [
            'Borne 7,4 kW (Mode 3, 32 A) : circuit dédié en 10 mm² protégé par disjoncteur 40 A courbe C (16 mm² au-delà de 30 m).',
            'DDR 30 mA dédié au point de recharge : Type A ou F en monophasé (Type B en triphasé). Si la borne n’intègre pas de détection de courant continu 6 mA, un DDR Type B est nécessaire.',
            'Vérifier la puissance souscrite et la valeur de la prise de terre (< 100 Ω conseillé). Installation par un professionnel qualifié IRVE pour les bornes > 3,7 kW.',
          ];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Nomenclature par circuit
// ─────────────────────────────────────────────────────────────────────────────

function line(item: string, quantity: number, unit: BomLine['unit'], category: BomCategory): BomLine {
  return { item, quantity, unit, category };
}

function meters(value: number): number {
  return Math.ceil(value);
}

function circuitBom(
  input: CircuitInput,
  spec: WiringSpecification,
  settings: ProjectSettings,
  ctx: { lengthM: number; points: number; pushButtons: number },
): BomLine[] {
  const bom: BomLine[] = [];
  const { lengthM, points, pushButtons } = ctx;
  const s = spec.wireSection;
  const phaseName = phaseColor(settings).name.toLowerCase();
  const main = lengthM * WIRE_MARGIN;
  const outdoor = input.roomCategory === 'OUTDOOR';

  // Protection au tableau
  const breaker = spec.requiresAfci
    ? `Disjoncteur 1P+N ${spec.breakerRating} courbe C avec détecteur d’arc (DDA)`
    : `Disjoncteur 1P+N ${spec.breakerRating} courbe C`;
  bom.push(line(breaker, 1, 'pièce', 'PROTECTION'));

  // Conducteurs de la ligne principale
  const fil = (color: string, length: number, section: WireSection = s) =>
    line(`Fil H07V-U ${formatSection(section)} ${color}`, meters(length), 'mètre', 'CONDUCTEURS');

  if (spec.installation === 'CABLE' && spec.cableDesignation) {
    bom.push(line(`Câble ${spec.cableDesignation}`, meters(main), 'mètre', 'CONDUCTEURS'));
    if (outdoor) {
      bom.push(line('Fourreau TPC rouge Ø40', meters(lengthM * 1.05), 'mètre', 'CONDUITS'));
      bom.push(line('Grillage avertisseur rouge', meters(lengthM), 'mètre', 'CONDUITS'));
    } else {
      bom.push(line('Colliers / attaches de fixation câble', 1, 'lot', 'CONDUITS'));
    }
  } else {
    bom.push(fil(phaseName, main), fil('bleu', main), fil('vert/jaune', main));
    if (input.type === 'LIGHTING_REMOTE_SWITCH') {
      bom.push(fil('orange', main), fil('noir', main));
    }
    bom.push(line(`Gaine ICTA ${spec.ictaDiameter.replace('mm', ' mm')}`, meters(lengthM * 1.05), 'mètre', 'CONDUITS'));
  }

  // Descentes de commande, appareillage, connexions
  const drop = SWITCH_DROP_M * WIRE_MARGIN;
  const ictaDrop = (n: number, diam: IctaDiameter = 'Ø16mm') =>
    line(`Gaine ICTA ${diam.replace('mm', ' mm')}`, meters(n * SWITCH_DROP_M * 1.05), 'mètre', 'CONDUITS');
  const box = (n: number) => line('Boîte d’encastrement Ø67 (simple)', n, 'pièce', 'APPAREILLAGE');
  const dcl = (n: number) => line('Point de centre DCL (boîte + douille DCL)', n, 'pièce', 'APPAREILLAGE');
  const wago = (n: number) => line(WAGO_ITEM, n, 'pièce', 'CONNEXION');
  const socketLabel = outdoor
    ? 'Prise de courant 16 A 2P+T étanche IP44 (IP55 conseillé)'
    : 'Prise de courant 16 A 2P+T à obturateurs';

  switch (input.type) {
    case 'LIGHTING_SIMPLE':
      bom.push(fil(phaseName, points * drop, '1.5mm²'), fil('orange', points * drop, '1.5mm²'), ictaDrop(points));
      bom.push(line(outdoor ? 'Interrupteur simple allumage étanche IP44' : 'Interrupteur simple allumage', points, 'pièce', 'APPAREILLAGE'));
      bom.push(box(points), dcl(points), wago(points * 3));
      break;
    case 'SOCKET_SWITCHED':
      bom.push(fil(phaseName, points * drop, '1.5mm²'), fil('orange', points * drop, '1.5mm²'), ictaDrop(points));
      bom.push(line('Interrupteur simple allumage', points, 'pièce', 'APPAREILLAGE'));
      bom.push(line(socketLabel, points, 'pièce', 'APPAREILLAGE'));
      bom.push(box(points * 2), wago(points * 3));
      break;
    case 'LIGHTING_TWO_WAY':
      bom.push(
        fil(phaseName, points * drop, '1.5mm²'),
        fil('orange', points * 2 * drop, '1.5mm²'),
        fil('violet', points * 2 * drop, '1.5mm²'),
        fil('noir', points * drop, '1.5mm²'),
        ictaDrop(points * 2, 'Ø20mm'),
      );
      bom.push(line('Interrupteur va-et-vient', points * 2, 'pièce', 'APPAREILLAGE'));
      bom.push(box(points * 2), dcl(points), wago(points * 4));
      break;
    case 'LIGHTING_REMOTE_SWITCH': {
      const buttons = points * pushButtons;
      bom.push(fil(phaseName, buttons * drop, '1.5mm²'), fil('orange', buttons * drop, '1.5mm²'), ictaDrop(buttons));
      bom.push(line('Télérupteur modulaire 16 A', points, 'pièce', 'TABLEAU'));
      bom.push(line('Bouton-poussoir', buttons, 'pièce', 'APPAREILLAGE'));
      bom.push(box(buttons), dcl(points), wago(points * 3 + buttons * 2));
      break;
    }
    case 'SOCKET_16A':
      bom.push(line(socketLabel, points, 'pièce', 'APPAREILLAGE'));
      bom.push(box(points), wago(3));
      break;
    case 'DEDICATED_20A': {
      const name = input.appliance ? APPLIANCE_LABELS[input.appliance].toLowerCase() : 'appareil';
      bom.push(line(`Prise de courant 16 A 2P+T dédiée (${name})`, 1, 'pièce', 'APPAREILLAGE'), box(1));
      break;
    }
    case 'COOKTOP_32A':
      bom.push(line('Sortie de câble 32 A (ou prise 32 A) pour plaque de cuisson', 1, 'pièce', 'APPAREILLAGE'), box(1));
      break;
    case 'WATER_HEATER':
      bom.push(line('Contacteur jour/nuit 20 A (auto/0/marche forcée)', 1, 'pièce', 'TABLEAU'));
      bom.push(line('Sortie de câble pour chauffe-eau', 1, 'pièce', 'APPAREILLAGE'));
      break;
    case 'HEAT_PUMP_AC':
      bom.push(line('Interrupteur-sectionneur de proximité IP65 (unité extérieure)', 1, 'pièce', 'APPAREILLAGE'));
      break;
    case 'IRVE_CHARGER':
      bom.push(
        input.irvePower === 'REINFORCED_3_7KW'
          ? line('Prise renforcée 3,7 kW pour véhicule électrique (Mode 2)', 1, 'pièce', 'APPAREILLAGE')
          : line('Borne de recharge 7,4 kW (Mode 3, prise Type 2)', 1, 'pièce', 'APPAREILLAGE'),
      );
      break;
  }

  return bom;
}

// ─────────────────────────────────────────────────────────────────────────────
// Découpage en circuits
// ─────────────────────────────────────────────────────────────────────────────

function maxPointsPerCircuit(component: SelectedComponent): number {
  if (LIGHTING_LIKE.includes(component.type)) return MAX_LIGHT_POINTS_PER_CIRCUIT;
  if (component.type === 'SOCKET_16A') return MAX_SOCKETS_PER_CIRCUIT[component.socketSection ?? '2.5mm²'];
  return 1; // circuits spécialisés : 1 appareil par circuit
}

function componentDisplayName(component: SelectedComponent): string {
  if (component.type === 'IRVE_CHARGER' && component.irvePower) {
    return component.label || IRVE_LABELS[component.irvePower];
  }
  return component.label;
}

export function splitIntoCircuits(component: SelectedComponent, settings: ProjectSettings): Omit<Circuit, 'ref' | 'groupId'>[] {
  const quantity = Math.max(1, Math.floor(component.quantity));
  const chunks = splitBalanced(quantity, maxPointsPerCircuit(component));
  const name = componentDisplayName(component);
  return chunks.map((points, i) => {
    const spec = buildWiringSpecification(
      {
        type: component.type,
        roomCategory: component.roomCategory,
        points,
        lengthM: component.cableLengthM,
        pushButtons: component.pushButtons,
        appliance: component.appliance,
        irvePower: component.irvePower,
        socketSection: component.socketSection,
      },
      settings,
    );
    if (chunks.length > 1 && maxPointsPerCircuit(component) > 1) {
      spec.notes.unshift(`Quantité répartie sur ${chunks.length} circuits (${chunks.join(' + ')}).`);
    }
    return {
      id: `${component.id}#${i}`,
      componentId: component.id,
      name: chunks.length > 1 ? `${name} (${i + 1}/${chunks.length})` : name,
      type: component.type,
      roomCategory: component.roomCategory,
      points,
      lengthM: component.cableLengthM,
      pushButtons: Math.max(2, component.pushButtons ?? 3),
      appliance: component.appliance,
      irvePower: component.irvePower,
      spec,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Répartition au tableau (interrupteurs différentiels 30 mA)
// ─────────────────────────────────────────────────────────────────────────────

function groupRating(circuits: Circuit[]): DifferentialRating {
  const heavy = circuits.some((c) => c.type === 'COOKTOP_32A' || c.type === 'WATER_HEATER');
  const totalIn = circuits.reduce((sum, c) => sum + breakerAmps(c.spec.breakerRating), 0);
  return heavy || totalIn > 120 ? '63A' : '40A';
}

export function buildDifferentialGroups(circuits: Omit<Circuit, 'ref' | 'groupId'>[]): {
  groups: DifferentialGroup[];
  convertedToTypeA: boolean;
} {
  const pending = circuits.map((c) => ({ ...c, ref: '', groupId: '' })) as Circuit[];
  const irve = pending.filter((c) => c.type === 'IRVE_CHARGER');
  const rest = pending.filter((c) => c.type !== 'IRVE_CHARGER');
  const order: DifferentialType[] = ['Type AC', 'Type A', 'Type F', 'Type B'];

  const raw: { type: DifferentialType; circuits: Circuit[]; dedicatedTo?: 'IRVE' }[] = [];
  for (const type of order) {
    const bucket = rest.filter((c) => c.spec.differentialType === type);
    for (const chunk of chunkBalanced(bucket, MAX_CIRCUITS_PER_RCD)) raw.push({ type, circuits: chunk });
  }
  for (const c of irve) raw.push({ type: c.spec.differentialType, circuits: [c], dedicatedTo: 'IRVE' });

  // Au moins un ID Type A par logement
  let convertedToTypeA = false;
  const hasTypeA = raw.some((g) => g.type === 'Type A' && !g.dedicatedTo);
  if (!hasTypeA) {
    const acGroups = raw.filter((g) => g.type === 'Type AC');
    const target = acGroups[acGroups.length - 1];
    if (target) {
      target.type = 'Type A';
      convertedToTypeA = true;
    }
  }

  // Numérotation : ID1, ID2… et circuits C1, C2… dans l'ordre du tableau
  let counter = 0;
  const groups: DifferentialGroup[] = raw.map((g, gi) => {
    const id = `ID${gi + 1}`;
    const circuitsOut = g.circuits.map((c) => {
      counter += 1;
      return {
        ...c,
        ref: `C${counter}`,
        groupId: id,
        spec: { ...c.spec, differentialType: g.type },
      };
    });
    return {
      id,
      ref: id,
      type: g.type,
      rating: g.dedicatedTo === 'IRVE' ? '40A' : groupRating(circuitsOut),
      dedicatedTo: g.dedicatedTo,
      circuits: circuitsOut,
    };
  });
  return { groups, convertedToTypeA };
}

// ─────────────────────────────────────────────────────────────────────────────
// Installation complète
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: BomCategory[] = ['TABLEAU', 'PROTECTION', 'CONDUCTEURS', 'CONDUITS', 'APPAREILLAGE', 'CONNEXION'];

export const CATEGORY_LABELS: Record<BomCategory, string> = {
  TABLEAU: 'Tableau',
  PROTECTION: 'Protections',
  CONDUCTEURS: 'Conducteurs',
  CONDUITS: 'Conduits & pose',
  APPAREILLAGE: 'Appareillage',
  CONNEXION: 'Connexion',
};

export function aggregateBom(lines: BomLine[]): BomLine[] {
  const map = new Map<string, BomLine>();
  for (const l of lines) {
    const key = `${l.category}|${l.item}|${l.unit}`;
    const existing = map.get(key);
    if (existing) existing.quantity += l.quantity;
    else map.set(key, { ...l });
  }
  const out: BomLine[] = [];
  for (const l of map.values()) {
    if (l.item === WAGO_ITEM && l.unit === 'pièce') {
      out.push({ ...l, item: `${WAGO_ITEM} — lot de ${WAGO_LOT_SIZE}`, quantity: Math.ceil(l.quantity / WAGO_LOT_SIZE), unit: 'lot' });
    } else {
      out.push(l);
    }
  }
  return out.sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.item.localeCompare(b.item, 'fr'),
  );
}

export function computeInstallation(components: SelectedComponent[], settings: ProjectSettings): InstallationResult {
  const rawCircuits = components.flatMap((c) => splitIntoCircuits(c, settings));
  const { groups, convertedToTypeA } = buildDifferentialGroups(rawCircuits);
  const circuits = groups.flatMap((g) => g.circuits);

  const surgeRequired = settings.lightningRisk === 'HIGH';
  const surgeIncluded = surgeRequired || settings.includeSurgeProtector;
  const afciCount = circuits.filter((c) => c.spec.requiresAfci).length;

  // Modules au tableau (largeur 17,5 / 18 mm)
  const countBom = (pred: (item: string) => boolean) =>
    circuits.reduce((n, c) => n + c.spec.billOfMaterials.filter((l) => pred(l.item)).reduce((a, l) => a + l.quantity, 0), 0);
  const breakerModules = circuits.reduce((n, c) => n + (c.spec.requiresAfci ? 2 : 1), 0);
  const auxModules = countBom((i) => i.startsWith('Télérupteur') || i.startsWith('Contacteur'));
  const rcdModules = groups.length * 2;
  const surgeModules = surgeIncluded && circuits.length > 0 ? 3 : 0;
  const boardModules = breakerModules + auxModules + rcdModules + surgeModules;
  const boardRows = circuits.length === 0 ? 0 : Math.max(1, Math.ceil((boardModules * (1 + BOARD_RESERVE)) / BOARD_MODULES_PER_ROW));

  const boardBom: BomLine[] = [];
  for (const g of groups) {
    boardBom.push(
      line(
        `Interrupteur différentiel 30 mA ${g.rating} ${g.type}${g.dedicatedTo === 'IRVE' ? ' (dédié IRVE)' : ''}`,
        1,
        'pièce',
        'PROTECTION',
      ),
    );
  }
  if (circuits.length > 0) {
    boardBom.push(line(`Coffret électrique ${boardRows} rangée${boardRows > 1 ? 's' : ''} de ${BOARD_MODULES_PER_ROW} modules`, 1, 'pièce', 'TABLEAU'));
    boardBom.push(line('Peigne d’alimentation 1P+N (13 modules)', boardRows, 'pièce', 'TABLEAU'));
    boardBom.push(line('Bornier de terre / répartiteur', 1, 'pièce', 'TABLEAU'));
    boardBom.push(line('Étiquettes de repérage des circuits', 1, 'lot', 'TABLEAU'));
    if (surgeIncluded) {
      boardBom.push(line('Parafoudre Type 2 monophasé 1P+N', 1, 'pièce', 'PROTECTION'));
      boardBom.push(line('Disjoncteur de déconnexion du parafoudre (selon notice)', 1, 'pièce', 'PROTECTION'));
    }
  }

  const billOfMaterials = aggregateBom([...boardBom, ...circuits.flatMap((c) => c.spec.billOfMaterials)]);

  const globalNotes: string[] = [];
  const globalWarnings: string[] = [];
  if (circuits.length > 0) {
    globalNotes.push(`Référentiel : ${NORM_REFERENCE}.`);
    globalNotes.push('Toute l’installation est protégée par des dispositifs différentiels 30 mA, avec 8 circuits maximum par interrupteur différentiel.');
    globalNotes.push('Au moins un interrupteur différentiel 30 mA Type A par logement.');
    globalNotes.push('Prévoir 20 % de réserve au tableau (prise en compte dans le nombre de rangées).');
    if (convertedToTypeA) {
      globalNotes.push('Un groupe Type AC a été passé en Type A pour respecter l’exigence d’au moins un ID Type A par logement.');
    }
    globalNotes.push(
      surgeRequired
        ? 'Parafoudre obligatoire (risque foudre élevé ou paratonnerre). La révision 2024 fonde la décision sur un niveau de risque calculé ; un parafoudre sur le réseau de communication cuivre devient alors obligatoire.'
        : 'Parafoudre : obligatoire selon l’évaluation du risque foudre (révision 2024) ou en présence de paratonnerre ; recommandé dans les autres cas.',
    );
    globalNotes.push(
      settings.afci
        ? `Détecteurs d’arc (DDA) intégrés sur ${afciCount} circuit${afciCount > 1 ? 's' : ''} éclairage / prises.`
        : 'Détecteurs d’arc (DDA) : non imposés en logement, conseillés pour limiter le risque d’incendie (chambres, circuits prises).',
    );
    const totalCircuits = circuits.length;
    if (totalCircuits > 0 && groups.filter((g) => !g.dedicatedTo).length < 2) {
      globalWarnings.push(
        'Selon la surface du logement, la norme impose un nombre minimal d’interrupteurs différentiels (souvent 2 ou 3). Vérifiez avec le tableau de la NF C 15-100 pour votre surface.',
      );
    }
  }
  for (const c of circuits) {
    for (const w of c.spec.warnings) globalWarnings.push(`${c.ref} — ${c.name} : ${w}`);
  }

  return {
    circuits,
    groups,
    surgeProtector: { required: surgeRequired, included: surgeIncluded && circuits.length > 0 },
    afciCount,
    boardModules,
    boardRows,
    billOfMaterials,
    globalNotes,
    globalWarnings,
  };
}

/** Export CSV (séparateur « ; », BOM UTF-8 pour Excel FR) */
export function bomToCsv(lines: BomLine[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [['Catégorie', 'Article', 'Quantité', 'Unité'].map(esc).join(';')];
  for (const l of lines) {
    rows.push([CATEGORY_LABELS[l.category], l.item, String(l.quantity), l.unit].map(esc).join(';'));
  }
  return `﻿${rows.join('\r\n')}`;
}
