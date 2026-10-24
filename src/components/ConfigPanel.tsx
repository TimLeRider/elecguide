import type { IrvePower, RoomCategory, SelectedComponent, SocketSection } from '../types/electrical';
import {
  CATALOG,
  FAMILY_LABELS,
  IRVE_LABELS,
  ROOM_CATEGORIES,
  ROOM_LABELS,
  iconFor,
  quantityLabel,
  type CatalogFamily,
} from '../rules/catalog';
import { useElecStore } from '../store/useElecStore';
import { CatalogIconView, IconMinus, IconPlus, IconTrash } from './icons';

const FAMILIES: CatalogFamily[] = ['LIGHTING', 'SOCKETS', 'SPECIALIZED'];

function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? Math.round(v) : min));
  return (
    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700" role="group" aria-label={label}>
      <button type="button" className="stepper-btn" onClick={() => onChange(clamp(value - 1))} aria-label={`Diminuer ${label}`}>
        <IconMinus size={14} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="w-10 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(clamp(e.target.valueAsNumber))}
        aria-label={label}
      />
      <button type="button" className="stepper-btn" onClick={() => onChange(clamp(value + 1))} aria-label={`Augmenter ${label}`}>
        <IconPlus size={14} />
      </button>
    </div>
  );
}

function ComponentRow({ component, active, onFocus }: { component: SelectedComponent; active: boolean; onFocus: () => void }) {
  const update = useElecStore((s) => s.updateComponent);
  const remove = useElecStore((s) => s.removeComponent);
  const patch = (p: Partial<SelectedComponent>) => update(component.id, p);
  const maxQty = component.type === 'SOCKET_16A' || component.type.startsWith('LIGHTING') ? 60 : 6;

  return (
    <li
      className={`rounded-xl border p-3 transition-colors ${
        active ? 'border-volt-400 bg-volt-50/60 dark:border-volt-500/60 dark:bg-volt-500/5' : 'border-slate-200 dark:border-slate-800'
      }`}
      onFocusCapture={onFocus}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-slate-500 dark:text-slate-400">
          <CatalogIconView icon={iconFor(component)} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <input
            value={component.label}
            onChange={(e) => patch({ label: e.target.value })}
            className="w-full truncate bg-transparent text-sm font-semibold outline-none focus:underline"
            aria-label="Nom du circuit"
          />
          <select
            value={component.roomCategory}
            onChange={(e) => patch({ roomCategory: e.target.value as RoomCategory })}
            className="mt-0.5 bg-transparent text-xs text-slate-500 outline-none dark:text-slate-400"
            aria-label="Type d'espace"
          >
            {ROOM_CATEGORIES.map((r) => (
              <option key={r.value} value={r.value}>
                {ROOM_LABELS[r.value]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => remove(component.id)}
          className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          aria-label={`Supprimer ${component.label}`}
        >
          <IconTrash size={16} />
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <label className="field-label">
          {quantityLabel(component.type)}
          <Stepper value={component.quantity} max={maxQty} onChange={(v) => patch({ quantity: v })} label={quantityLabel(component.type)} />
        </label>
        <label className="field-label">
          Longueur (m)
          <Stepper value={component.cableLengthM} max={150} onChange={(v) => patch({ cableLengthM: v })} label="Longueur de ligne en mètres" />
        </label>
        {component.type === 'SOCKET_16A' && (
          <label className="field-label col-span-2">
            Section des prises
            <select
              className="select"
              value={component.socketSection ?? '2.5mm²'}
              onChange={(e) => patch({ socketSection: e.target.value as SocketSection })}
            >
              <option value="2.5mm²">2,5 mm² · 20 A · 12 prises max</option>
              <option value="1.5mm²">1,5 mm² · 16 A · 8 prises max</option>
            </select>
          </label>
        )}
        {component.type === 'IRVE_CHARGER' && (
          <label className="field-label col-span-2">
            Puissance de recharge
            <select
              className="select"
              value={component.irvePower ?? 'WALLBOX_7_4KW'}
              onChange={(e) => patch({ irvePower: e.target.value as IrvePower })}
            >
              {(Object.keys(IRVE_LABELS) as IrvePower[]).map((k) => (
                <option key={k} value={k}>
                  {IRVE_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        )}
        {component.type === 'LIGHTING_REMOTE_SWITCH' && (
          <label className="field-label col-span-2">
            Poussoirs par télérupteur
            <Stepper value={component.pushButtons ?? 3} min={2} max={10} onChange={(v) => patch({ pushButtons: v })} label="Poussoirs par télérupteur" />
          </label>
        )}
      </div>
    </li>
  );
}

/** Zone A — panneau de configuration */
export default function ConfigPanel() {
  const roomCategory = useElecStore((s) => s.roomCategory);
  const setRoomCategory = useElecStore((s) => s.setRoomCategory);
  const addFromCatalog = useElecStore((s) => s.addFromCatalog);
  const components = useElecStore((s) => s.components);
  const activeView = useElecStore((s) => s.activeView);
  const setActiveView = useElecStore((s) => s.setActiveView);
  const settings = useElecStore((s) => s.settings);
  const updateSettings = useElecStore((s) => s.updateSettings);

  const roomHint = ROOM_CATEGORIES.find((r) => r.value === roomCategory)?.hint;

  return (
    <aside aria-label="Configuration" className="flex min-w-0 flex-col gap-4">
      <section className="card p-4">
        <h2 className="section-title">1. Type d’espace</h2>
        <div className="seg mt-2 w-full" role="radiogroup" aria-label="Type d'espace">
          {ROOM_CATEGORIES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={roomCategory === r.value}
              onClick={() => setRoomCategory(r.value)}
              className={`flex-1 justify-center ${roomCategory === r.value ? 'seg-btn seg-btn-active' : 'seg-btn'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{roomHint} — appliqué aux prochains ajouts.</p>
      </section>

      <section className="card p-4">
        <h2 className="section-title">2. Ajouter un besoin</h2>
        {FAMILIES.map((family) => (
          <div key={family} className="mt-3">
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{FAMILY_LABELS[family]}</h3>
            <div className="grid grid-cols-2 gap-2">
              {CATALOG.filter((c) => c.family === family).map((item) => (
                <button key={item.key} type="button" onClick={() => addFromCatalog(item.key)} className="catalog-card group">
                  <span className="flex w-full items-center justify-between">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-700 transition-colors group-hover:bg-volt-100 group-hover:text-volt-700 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-volt-500/20 dark:group-hover:text-volt-300">
                      <CatalogIconView icon={item.icon} size={18} />
                    </span>
                    {item.badge && <span className="badge">{item.badge}</span>}
                  </span>
                  <span className="mt-2 text-left text-[13px] font-semibold leading-tight">{item.label}</span>
                  <span className="mt-0.5 text-left text-[11px] leading-tight text-slate-500 dark:text-slate-400">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="section-title">3. Votre sélection</h2>
          <span className="text-xs text-slate-400">{components.length} élément{components.length > 1 ? 's' : ''}</span>
        </div>
        {components.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Cliquez une carte ci-dessus pour ajouter un circuit.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {components.map((c) => (
              <ComponentRow
                key={c.id}
                component={c}
                active={activeView.startsWith(`${c.id}#`)}
                onFocus={() => {
                  if (!activeView.startsWith(`${c.id}#`)) setActiveView(`${c.id}#0`);
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <h2 className="section-title">4. Options de sécurité</h2>
        <label className="field-label mt-3">
          Risque foudre
          <select
            className="select"
            value={settings.lightningRisk}
            onChange={(e) => updateSettings({ lightningRisk: e.target.value as 'STANDARD' | 'HIGH' })}
          >
            <option value="STANDARD">Standard / non évalué</option>
            <option value="HIGH">Élevé ou bâtiment avec paratonnerre</option>
          </select>
        </label>
        <div className="mt-3 flex flex-col gap-2.5">
          <Toggle
            checked={settings.lightningRisk === 'HIGH' || settings.includeSurgeProtector}
            disabled={settings.lightningRisk === 'HIGH'}
            onChange={(v) => updateSettings({ includeSurgeProtector: v })}
            label="Parafoudre au tableau"
            hint={settings.lightningRisk === 'HIGH' ? 'Obligatoire avec ce niveau de risque' : 'Recommandé'}
          />
          <Toggle
            checked={settings.afci}
            onChange={(v) => updateSettings({ afci: v })}
            label="Détecteurs d’arc (DDA)"
            hint="Sur les circuits éclairage et prises"
          />
          <Toggle
            checked={settings.typeAEverywhere}
            onChange={(v) => updateSettings({ typeAEverywhere: v })}
            label="Différentiels Type A partout"
            hint="Remplace les Type AC (meilleure immunité)"
          />
        </div>
      </section>
    </aside>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start justify-between gap-3 ${disabled ? 'opacity-70' : 'cursor-pointer'}`}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-volt-500 peer-focus-visible:ring-2 peer-focus-visible:ring-volt-400 dark:bg-slate-700 dark:peer-checked:bg-volt-500" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
