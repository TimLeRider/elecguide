import { create } from 'zustand';
import type { ProjectSettings, RoomCategory, SelectedComponent } from '../types/electrical';
import { CATALOG } from '../rules/catalog';
import { DEFAULT_SETTINGS } from '../rules/electricalRules';

export type ActiveView = 'BOARD' | string;

interface ElecState {
  roomCategory: RoomCategory;
  components: SelectedComponent[];
  settings: ProjectSettings;
  activeView: ActiveView;
  setRoomCategory: (room: RoomCategory) => void;
  addFromCatalog: (key: string) => void;
  updateComponent: (id: string, patch: Partial<SelectedComponent>) => void;
  removeComponent: (id: string) => void;
  updateSettings: (patch: Partial<ProjectSettings>) => void;
  setActiveView: (view: ActiveView) => void;
  reset: () => void;
}

function uid(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/**
 * État de l'application. Volontairement NON persisté :
 * conformément aux mentions légales, seuls le thème et l'écran d'accueil
 * sont enregistrés localement.
 */
export const useElecStore = create<ElecState>((set) => ({
  roomCategory: 'DRY',
  components: [],
  settings: DEFAULT_SETTINGS,
  activeView: 'BOARD',

  setRoomCategory: (roomCategory) => set({ roomCategory }),

  addFromCatalog: (key) =>
    set((state) => {
      const item = CATALOG.find((c) => c.key === key);
      if (!item) return state;
      const component: SelectedComponent = {
        id: uid(),
        type: item.type,
        label: item.label,
        roomCategory: state.roomCategory,
        ...item.defaults,
      };
      return {
        components: [...state.components, component],
        activeView: `${component.id}#0`,
      };
    }),

  updateComponent: (id, patch) =>
    set((state) => ({
      components: state.components.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      activeView: state.activeView.startsWith(`${id}#`) ? 'BOARD' : state.activeView,
    })),

  updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

  setActiveView: (activeView) => set({ activeView }),

  reset: () =>
    set({ components: [], settings: DEFAULT_SETTINGS, activeView: 'BOARD', roomCategory: 'DRY' }),
}));
