/**
 * Modèles de données ElecGuide.
 * Base : modèles du cahier des charges (§6), enrichis pour couvrir tout le catalogue
 * (télérupteur, prise commandée, chauffe-eau) et les sections/calibres IRVE réels.
 */

export type CircuitType =
  | 'LIGHTING_SIMPLE'
  | 'LIGHTING_TWO_WAY'
  | 'LIGHTING_REMOTE_SWITCH'
  | 'SOCKET_16A'
  | 'SOCKET_SWITCHED'
  | 'DEDICATED_20A'
  | 'COOKTOP_32A'
  | 'WATER_HEATER'
  | 'HEAT_PUMP_AC'
  | 'IRVE_CHARGER';

export type RoomCategory = 'DRY' | 'WET' | 'OUTDOOR';

export type DedicatedAppliance = 'OVEN' | 'WASHING_MACHINE' | 'DISHWASHER' | 'DRYER';

export type IrvePower = 'REINFORCED_3_7KW' | 'WALLBOX_7_4KW';

export type SocketSection = '1.5mm²' | '2.5mm²';

export interface SelectedComponent {
  id: string;
  type: CircuitType;
  label: string;
  /** Points lumineux, prises, télérupteurs ou appareils selon le type */
  quantity: number;
  roomCategory: RoomCategory;
  /** Longueur estimée de la ligne : tableau → dernier point (m) */
  cableLengthM: number;
  appliance?: DedicatedAppliance;
  irvePower?: IrvePower;
  socketSection?: SocketSection;
  /** Nombre de boutons-poussoirs par télérupteur */
  pushButtons?: number;
}

export type WireSection = '1.5mm²' | '2.5mm²' | '6mm²' | '10mm²' | '16mm²';
export type BreakerRating = '10A' | '16A' | '20A' | '32A' | '40A';
export type DifferentialType = 'Type AC' | 'Type A' | 'Type F' | 'Type B';
export type DifferentialRating = '40A' | '63A';
export type IctaDiameter = 'Ø16mm' | 'Ø20mm' | 'Ø25mm' | 'Ø32mm';
export type BomUnit = 'pièce' | 'mètre' | 'lot';

export type WireRole =
  | 'PHASE'
  | 'NEUTRAL'
  | 'EARTH'
  | 'TRAVELER_1'
  | 'TRAVELER_2'
  | 'RETURN'
  | 'CONTROL';

export interface WireSpec {
  role: WireRole;
  color: string;
  /** Nom de la couleur (ex. « Rouge ») */
  colorName: string;
  label: string;
  gauge: string;
}

export type BomCategory =
  | 'TABLEAU'
  | 'PROTECTION'
  | 'CONDUCTEURS'
  | 'CONDUITS'
  | 'APPAREILLAGE'
  | 'CONNEXION';

export interface BomLine {
  item: string;
  quantity: number;
  unit: BomUnit;
  category: BomCategory;
}

export interface WiringSpecification {
  circuitType: CircuitType;
  wireSection: WireSection;
  breakerRating: BreakerRating;
  differentialType: DifferentialType;
  ictaDiameter: IctaDiameter;
  requiresAfci?: boolean;
  requiresSurgeProtector?: boolean;
  wires: WireSpec[];
  billOfMaterials: BomLine[];
  /** Mode de pose : fils H07V-U sous gaine ICTA, ou câble multiconducteur U1000 R2V */
  installation: 'WIRES_IN_CONDUIT' | 'CABLE';
  cableDesignation?: string;
  /** Courant d'emploi retenu pour le calcul de chute de tension (A) */
  designCurrentA: number;
  voltageDropPercent: number;
  maxVoltageDropPercent: number;
  notes: string[];
  warnings: string[];
}

export interface Circuit {
  id: string;
  componentId: string;
  /** Repère au tableau : C1, C2… */
  ref: string;
  name: string;
  type: CircuitType;
  roomCategory: RoomCategory;
  /** Nombre de points (points lumineux, prises, appareils) sur ce circuit */
  points: number;
  lengthM: number;
  pushButtons: number;
  appliance?: DedicatedAppliance;
  irvePower?: IrvePower;
  spec: WiringSpecification;
  groupId: string;
}

export interface DifferentialGroup {
  id: string;
  ref: string;
  type: DifferentialType;
  rating: DifferentialRating;
  dedicatedTo?: 'IRVE';
  circuits: Circuit[];
}

export type LightningRisk = 'STANDARD' | 'HIGH';
export type PhaseColor = 'RED' | 'BROWN';

export interface ProjectSettings {
  /** HIGH : risque foudre élevé (évaluation) ou bâtiment équipé de paratonnerre */
  lightningRisk: LightningRisk;
  includeSurgeProtector: boolean;
  /** Ajoute des détecteurs d'arc (DDA) sur les circuits éclairage et prises */
  afci: boolean;
  /** Remplace les ID Type AC par des Type A */
  typeAEverywhere: boolean;
  phaseColor: PhaseColor;
}

export type DeviceStatus = 'REQUIRED' | 'RECOMMENDED' | 'INCLUDED' | 'NOT_INCLUDED';

export interface InstallationResult {
  circuits: Circuit[];
  groups: DifferentialGroup[];
  surgeProtector: { required: boolean; included: boolean };
  afciCount: number;
  boardModules: number;
  boardRows: number;
  billOfMaterials: BomLine[];
  globalNotes: string[];
  globalWarnings: string[];
}
