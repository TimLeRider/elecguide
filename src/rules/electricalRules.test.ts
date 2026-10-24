import { describe, expect, it } from 'vitest';
import type { SelectedComponent } from '../types/electrical';
import {
  DEFAULT_SETTINGS,
  buildWiringSpecification,
  computeInstallation,
  splitBalanced,
  voltageDropPercent,
} from './electricalRules';

let n = 0;
const comp = (partial: Partial<SelectedComponent> & Pick<SelectedComponent, 'type'>): SelectedComponent => ({
  id: `c${++n}`,
  label: partial.type,
  quantity: 1,
  roomCategory: 'DRY',
  cableLengthM: 10,
  ...partial,
});

describe('utilitaires', () => {
  it('répartit de façon équilibrée', () => {
    expect(splitBalanced(13, 12)).toEqual([7, 6]);
    expect(splitBalanced(8, 8)).toEqual([8]);
    expect(splitBalanced(17, 8)).toEqual([6, 6, 5]);
  });
  it('calcule la chute de tension', () => {
    // 2 × 0,0225 × 20 m × 20 A / 2,5 mm² = 7,2 V → 3,1 %
    expect(voltageDropPercent(20, 20, '2.5mm²')).toBe(3.1);
  });
});

describe('règles par circuit', () => {
  it('éclairage : 1,5 mm² / 16 A / AC', () => {
    const s = buildWiringSpecification({ type: 'LIGHTING_SIMPLE', roomCategory: 'DRY', points: 3, lengthM: 12 }, DEFAULT_SETTINGS);
    expect(s.wireSection).toBe('1.5mm²');
    expect(s.breakerRating).toBe('16A');
    expect(s.differentialType).toBe('Type AC');
    expect(s.ictaDiameter).toBe('Ø16mm');
  });
  it('prises 1,5 mm² → 16 A ; 2,5 mm² → 20 A', () => {
    const a = buildWiringSpecification({ type: 'SOCKET_16A', roomCategory: 'DRY', points: 5, lengthM: 15, socketSection: '1.5mm²' }, DEFAULT_SETTINGS);
    const b = buildWiringSpecification({ type: 'SOCKET_16A', roomCategory: 'DRY', points: 5, lengthM: 15 }, DEFAULT_SETTINGS);
    expect(a.breakerRating).toBe('16A');
    expect(b.wireSection).toBe('2.5mm²');
    expect(b.breakerRating).toBe('20A');
  });
  it('lave-linge et plaques en Type A', () => {
    const ll = buildWiringSpecification({ type: 'DEDICATED_20A', appliance: 'WASHING_MACHINE', roomCategory: 'WET', points: 1, lengthM: 10 }, DEFAULT_SETTINGS);
    const pc = buildWiringSpecification({ type: 'COOKTOP_32A', roomCategory: 'WET', points: 1, lengthM: 8 }, DEFAULT_SETTINGS);
    expect(ll.differentialType).toBe('Type A');
    expect(pc.differentialType).toBe('Type A');
    expect(pc.wireSection).toBe('6mm²');
    expect(pc.breakerRating).toBe('32A');
  });
  it('PAC / clim en Type F', () => {
    const s = buildWiringSpecification({ type: 'HEAT_PUMP_AC', roomCategory: 'OUTDOOR', points: 1, lengthM: 15 }, DEFAULT_SETTINGS);
    expect(s.differentialType).toBe('Type F');
    expect(s.installation).toBe('CABLE');
  });
  it('IRVE 7,4 kW : 10 mm² / 40 A, 16 mm² au-delà de 30 m', () => {
    const near = buildWiringSpecification({ type: 'IRVE_CHARGER', irvePower: 'WALLBOX_7_4KW', roomCategory: 'DRY', points: 1, lengthM: 20 }, DEFAULT_SETTINGS);
    const far = buildWiringSpecification({ type: 'IRVE_CHARGER', irvePower: 'WALLBOX_7_4KW', roomCategory: 'DRY', points: 1, lengthM: 40 }, DEFAULT_SETTINGS);
    expect(near.wireSection).toBe('10mm²');
    expect(near.breakerRating).toBe('40A');
    expect(far.wireSection).toBe('16mm²');
  });
  it('IRVE 3,7 kW : 2,5 mm² / 20 A', () => {
    const s = buildWiringSpecification({ type: 'IRVE_CHARGER', irvePower: 'REINFORCED_3_7KW', roomCategory: 'DRY', points: 1, lengthM: 15 }, DEFAULT_SETTINGS);
    expect(s.wireSection).toBe('2.5mm²');
    expect(s.breakerRating).toBe('20A');
  });
  it('plaques : passage en 10 mm² si chute de tension excessive', () => {
    const s = buildWiringSpecification({ type: 'COOKTOP_32A', roomCategory: 'DRY', points: 1, lengthM: 50 }, DEFAULT_SETTINGS);
    expect(s.wireSection).toBe('10mm²');
  });
});

describe('installation', () => {
  it('découpe 13 prises 2,5 mm² en 2 circuits', () => {
    const r = computeInstallation([comp({ type: 'SOCKET_16A', quantity: 13 })], DEFAULT_SETTINGS);
    expect(r.circuits).toHaveLength(2);
    expect(r.circuits.map((c) => c.points)).toEqual([7, 6]);
  });
  it('8 circuits max par ID et au moins un ID Type A', () => {
    const r = computeInstallation([comp({ type: 'LIGHTING_SIMPLE', quantity: 72 })], DEFAULT_SETTINGS);
    expect(r.circuits).toHaveLength(9);
    for (const g of r.groups) expect(g.circuits.length).toBeLessThanOrEqual(8);
    expect(r.groups.some((g) => g.type === 'Type A')).toBe(true);
  });
  it('IRVE sur ID dédié, PAC sur ID Type F', () => {
    const r = computeInstallation(
      [comp({ type: 'IRVE_CHARGER', irvePower: 'WALLBOX_7_4KW' }), comp({ type: 'HEAT_PUMP_AC' }), comp({ type: 'SOCKET_16A', quantity: 4 })],
      DEFAULT_SETTINGS,
    );
    const irve = r.groups.find((g) => g.dedicatedTo === 'IRVE');
    expect(irve?.circuits).toHaveLength(1);
    expect(r.groups.find((g) => g.circuits.some((c) => c.type === 'HEAT_PUMP_AC'))?.type).toBe('Type F');
  });
  it('les circuits spécialisés ont 1 appareil par circuit', () => {
    const r = computeInstallation([comp({ type: 'DEDICATED_20A', appliance: 'OVEN', quantity: 2 })], DEFAULT_SETTINGS);
    expect(r.circuits).toHaveLength(2);
  });
  it('agrège la nomenclature et compte les Wago par lots', () => {
    const r = computeInstallation([comp({ type: 'LIGHTING_SIMPLE', quantity: 4 })], DEFAULT_SETTINGS);
    const wago = r.billOfMaterials.find((l) => l.item.startsWith('Bornes de connexion'));
    expect(wago?.unit).toBe('lot');
    expect(r.billOfMaterials.some((l) => l.item.startsWith('Coffret électrique'))).toBe(true);
  });
});
