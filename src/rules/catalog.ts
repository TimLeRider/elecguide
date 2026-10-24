import type { CircuitType, DedicatedAppliance, IrvePower, RoomCategory, SelectedComponent } from '../types/electrical';

export type CatalogFamily = 'LIGHTING' | 'SOCKETS' | 'SPECIALIZED';
export type CatalogIcon =
  | 'bulb'
  | 'twoway'
  | 'remote'
  | 'plug'
  | 'plugSwitch'
  | 'oven'
  | 'washer'
  | 'dishwasher'
  | 'cooktop'
  | 'waterHeater'
  | 'heatPump'
  | 'car';

export interface CatalogItem {
  key: string;
  type: CircuitType;
  family: CatalogFamily;
  label: string;
  hint: string;
  icon: CatalogIcon;
  badge?: string;
  defaults: {
    quantity: number;
    cableLengthM: number;
    appliance?: DedicatedAppliance;
    irvePower?: IrvePower;
    pushButtons?: number;
    socketSection?: '1.5mm²' | '2.5mm²';
  };
}

export const FAMILY_LABELS: Record<CatalogFamily, string> = {
  LIGHTING: 'Éclairage',
  SOCKETS: 'Prises',
  SPECIALIZED: 'Circuits spécialisés & nouveautés normatives',
};

export const CATALOG: CatalogItem[] = [
  {
    key: 'lighting-simple',
    type: 'LIGHTING_SIMPLE',
    family: 'LIGHTING',
    label: 'Simple allumage',
    hint: '1,5 mm² · 16 A · 8 pts max',
    icon: 'bulb',
    defaults: { quantity: 1, cableLengthM: 12 },
  },
  {
    key: 'lighting-two-way',
    type: 'LIGHTING_TWO_WAY',
    family: 'LIGHTING',
    label: 'Va-et-vient',
    hint: '2 commandes · navettes',
    icon: 'twoway',
    defaults: { quantity: 1, cableLengthM: 15 },
  },
  {
    key: 'lighting-remote',
    type: 'LIGHTING_REMOTE_SWITCH',
    family: 'LIGHTING',
    label: 'Télérupteur',
    hint: '3 commandes et plus',
    icon: 'remote',
    defaults: { quantity: 1, cableLengthM: 18, pushButtons: 3 },
  },
  {
    key: 'socket-16a',
    type: 'SOCKET_16A',
    family: 'SOCKETS',
    label: 'Prises 16 A',
    hint: '2,5 mm² · 20 A · 12 max',
    icon: 'plug',
    defaults: { quantity: 4, cableLengthM: 20, socketSection: '2.5mm²' },
  },
  {
    key: 'socket-switched',
    type: 'SOCKET_SWITCHED',
    family: 'SOCKETS',
    label: 'Prise commandée',
    hint: '1,5 mm² · 16 A · interrupteur',
    icon: 'plugSwitch',
    defaults: { quantity: 1, cableLengthM: 12 },
  },
  {
    key: 'oven',
    type: 'DEDICATED_20A',
    family: 'SPECIALIZED',
    label: 'Four',
    hint: '2,5 mm² · 20 A · dédié',
    icon: 'oven',
    defaults: { quantity: 1, cableLengthM: 10, appliance: 'OVEN' },
  },
  {
    key: 'washing-machine',
    type: 'DEDICATED_20A',
    family: 'SPECIALIZED',
    label: 'Lave-linge',
    hint: '2,5 mm² · 20 A · ID Type A',
    icon: 'washer',
    defaults: { quantity: 1, cableLengthM: 12, appliance: 'WASHING_MACHINE' },
  },
  {
    key: 'dishwasher',
    type: 'DEDICATED_20A',
    family: 'SPECIALIZED',
    label: 'Lave-vaisselle',
    hint: '2,5 mm² · 20 A · ID Type A',
    icon: 'dishwasher',
    defaults: { quantity: 1, cableLengthM: 10, appliance: 'DISHWASHER' },
  },
  {
    key: 'cooktop',
    type: 'COOKTOP_32A',
    family: 'SPECIALIZED',
    label: 'Plaques de cuisson',
    hint: '6 mm² · 32 A · ID Type A',
    icon: 'cooktop',
    defaults: { quantity: 1, cableLengthM: 8 },
  },
  {
    key: 'water-heater',
    type: 'WATER_HEATER',
    family: 'SPECIALIZED',
    label: 'Chauffe-eau (HC)',
    hint: '2,5 mm² · 20 A · contacteur',
    icon: 'waterHeater',
    defaults: { quantity: 1, cableLengthM: 12 },
  },
  {
    key: 'heat-pump',
    type: 'HEAT_PUMP_AC',
    family: 'SPECIALIZED',
    label: 'Clim / Pompe à chaleur',
    hint: '2,5 mm² · 20 A · ID Type F',
    icon: 'heatPump',
    badge: 'Type F',
    defaults: { quantity: 1, cableLengthM: 15 },
  },
  {
    key: 'irve',
    type: 'IRVE_CHARGER',
    family: 'SPECIALIZED',
    label: 'Borne de recharge (IRVE)',
    hint: '7,4 kW · 10 mm² · 40 A',
    icon: 'car',
    badge: 'IRVE',
    defaults: { quantity: 1, cableLengthM: 20, irvePower: 'WALLBOX_7_4KW' },
  },
];

export const ROOM_CATEGORIES: { value: RoomCategory; label: string; hint: string }[] = [
  { value: 'DRY', label: 'Pièce sèche', hint: 'Séjour, chambre, bureau, couloir' },
  { value: 'WET', label: 'Pièce humide', hint: 'Salle de bain, cuisine, buanderie' },
  { value: 'OUTDOOR', label: 'Extérieur', hint: 'Terrasse, jardin, abri, allée' },
];

export const ROOM_LABELS: Record<RoomCategory, string> = {
  DRY: 'Pièce sèche',
  WET: 'Pièce humide',
  OUTDOOR: 'Extérieur',
};

export const APPLIANCE_LABELS: Record<DedicatedAppliance, string> = {
  OVEN: 'Four',
  WASHING_MACHINE: 'Lave-linge',
  DISHWASHER: 'Lave-vaisselle',
  DRYER: 'Sèche-linge',
};

export const IRVE_LABELS: Record<IrvePower, string> = {
  REINFORCED_3_7KW: 'Prise renforcée 3,7 kW',
  WALLBOX_7_4KW: 'Wallbox 7,4 kW',
};

/** Libellé de la quantité selon le type de circuit */
export function quantityLabel(type: CircuitType): string {
  switch (type) {
    case 'LIGHTING_SIMPLE':
      return 'Points lumineux';
    case 'LIGHTING_TWO_WAY':
      return 'Installations';
    case 'LIGHTING_REMOTE_SWITCH':
      return 'Télérupteurs';
    case 'SOCKET_16A':
    case 'SOCKET_SWITCHED':
      return 'Prises';
    case 'IRVE_CHARGER':
      return 'Bornes';
    default:
      return 'Appareils';
  }
}

export function iconFor(component: Pick<SelectedComponent, 'type' | 'appliance'>): CatalogIcon {
  const match = CATALOG.find(
    (c) => c.type === component.type && (c.defaults.appliance ?? null) === (component.appliance ?? null),
  );
  return match?.icon ?? 'plug';
}
