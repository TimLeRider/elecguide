import type { ReactNode } from 'react';
import { WIRE_COLORS } from '../../rules/electricalRules';

export type Pt = [number, number];

/** Le schéma est toujours dessiné sur « papier » clair (lisibilité du fil noir, impression) */
export const INK = '#1e293b';
export const MUTED = '#64748b';
export const PAPER = '#ffffff';
export const MODULE_FILL = '#f8fafc';

export function pathOf(points: Pt[]): string {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

export function Wire({
  points,
  color,
  earth = false,
  dashed = false,
  title,
}: {
  points: Pt[];
  color?: string;
  earth?: boolean;
  dashed?: boolean;
  title?: string;
}) {
  const d = pathOf(points);
  const common = { d, fill: 'none', strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (earth) {
    return (
      <g>
        {title && <title>{title}</title>}
        <path {...common} stroke={WIRE_COLORS.EARTH_GREEN} />
        <path {...common} stroke={WIRE_COLORS.EARTH_YELLOW} strokeDasharray="6 6" strokeLinecap="butt" />
      </g>
    );
  }
  return (
    <path {...common} stroke={color} strokeDasharray={dashed ? '5 5' : undefined}>
      {title && <title>{title}</title>}
    </path>
  );
}

export function Junction({ x, y, color }: { x: number; y: number; color: string }) {
  return <circle cx={x} cy={y} r={3.8} fill={color} stroke={PAPER} strokeWidth={1.2} />;
}

export function Terminal({
  x,
  y,
  label,
  position = 'below',
}: {
  x: number;
  y: number;
  label?: string;
  position?: 'below' | 'above';
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={3.4} fill={PAPER} stroke={INK} strokeWidth={1.4} />
      {label && (
        <text
          x={x}
          y={position === 'below' ? y - 7 : y + 13}
          fontSize={8}
          fontWeight={600}
          textAnchor="middle"
          fill={MUTED}
          fontFamily="JetBrains Mono, monospace"
        >
          {label}
        </text>
      )}
    </g>
  );
}

export function Module({
  x,
  y,
  w,
  h,
  title,
  subtitle,
  accent = '#334155',
  highlight = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  accent?: string;
  highlight?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={MODULE_FILL}
        stroke={highlight ? '#f59e0b' : INK}
        strokeWidth={highlight ? 2.5 : 1.4}
      />
      <text x={x + w / 2} y={y + 15} fontSize={11} fontWeight={700} textAnchor="middle" fill={INK}>
        {title}
      </text>
      <rect x={x + w / 2 - 8} y={y + h / 2 - 9} width={16} height={22} rx={3} fill={accent} />
      {subtitle && (
        <text x={x + w / 2} y={y + h - 8} fontSize={8.5} textAnchor="middle" fill={MUTED} fontWeight={600}>
          {subtitle}
        </text>
      )}
    </g>
  );
}

export function DeviceBox({
  x,
  y,
  w,
  h,
  label,
  sublabel,
  children,
  dashed = false,
  labelPos = 'above',
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  sublabel?: string;
  children?: ReactNode;
  dashed?: boolean;
  labelPos?: 'above' | 'left';
}) {
  const left = labelPos === 'left';
  const lx = left ? x - 8 : x + w / 2;
  const anchor = left ? 'end' : 'middle';
  const ly = left ? y + h / 2 + 1 : y - 8;
  const sy = left ? y + h / 2 + 13 : y - 20;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={PAPER}
        stroke={INK}
        strokeWidth={1.5}
        strokeDasharray={dashed ? '4 4' : undefined}
      />
      {children}
      {label && (
        <text x={lx} y={ly} fontSize={10.5} fontWeight={700} textAnchor={anchor} fill={INK} paintOrder="stroke" stroke={PAPER} strokeWidth={3}>
          {label}
        </text>
      )}
      {sublabel && (
        <text x={lx} y={sy} fontSize={8.5} textAnchor={anchor} fill={MUTED} paintOrder="stroke" stroke={PAPER} strokeWidth={3}>
          {sublabel}
        </text>
      )}
    </g>
  );
}

export function WireLabel({ x, y, text, color, anchor = 'middle' }: { x: number; y: number; text: string; color: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={x} y={y} fontSize={8.5} fontWeight={600} fill={color} textAnchor={anchor} paintOrder="stroke" stroke={PAPER} strokeWidth={3}>
      {text}
    </text>
  );
}

// ─── Glyphes (symboles simplifiés, inspirés de la NF EN 60617) ─────────────────

export function LampGlyph({ cx, cy, r = 15 }: { cx: number; cy: number; r?: number }) {
  const k = r * 0.7;
  return (
    <g stroke={INK} strokeWidth={1.6} fill="none">
      <circle cx={cx} cy={cy} r={r} fill="#fffbeb" />
      <path d={`M${cx - k} ${cy - k} L${cx + k} ${cy + k} M${cx + k} ${cy - k} L${cx - k} ${cy + k}`} />
    </g>
  );
}

export function SocketGlyph({ cx, cy, r = 15 }: { cx: number; cy: number; r?: number }) {
  return (
    <g stroke={INK} strokeWidth={1.5}>
      <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
      <circle cx={cx - r * 0.42} cy={cy + 2} r={2.6} fill={INK} />
      <circle cx={cx + r * 0.42} cy={cy + 2} r={2.6} fill={INK} />
      <path d={`M${cx} ${cy - r} L${cx} ${cy - r * 0.45}`} strokeWidth={2.4} />
    </g>
  );
}

/** Interrupteur simple : bornes en bas (gauche = entrée, droite = sortie) */
export function SwitchGlyph({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const px = x + w * 0.25;
  const py = y + h * 0.72;
  const cx = x + w * 0.75;
  return (
    <g stroke={INK} strokeWidth={1.6} fill="none">
      <circle cx={px} cy={py} r={2.2} fill={INK} />
      <path d={`M${px} ${py} L${cx + 2} ${y + h * 0.3}`} />
      <path d={`M${cx} ${py} L${cx} ${y + h * 0.5}`} />
    </g>
  );
}

/** Interrupteur va-et-vient : commun en bas, deux plots en haut */
export function TwoWayGlyph({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  return (
    <g stroke={INK} strokeWidth={1.6} fill="none">
      <circle cx={cx} cy={y + h * 0.75} r={2.2} fill={INK} />
      <path d={`M${cx} ${y + h * 0.75} L${x + w * 0.28} ${y + h * 0.3}`} />
      <path d={`M${x + w * 0.24} ${y + h * 0.25} L${x + w * 0.24} ${y + 4}`} />
      <path d={`M${x + w * 0.76} ${y + h * 0.25} L${x + w * 0.76} ${y + 4}`} />
    </g>
  );
}

export function PushGlyph({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  return (
    <g stroke={INK} strokeWidth={1.6} fill="none">
      <path d={`M${cx - 10} ${y + h * 0.55} L${cx + 10} ${y + h * 0.55}`} />
      <path d={`M${cx} ${y + h * 0.55} L${cx} ${y + h * 0.28} M${cx - 6} ${y + h * 0.28} L${cx + 6} ${y + h * 0.28}`} />
      <path d={`M${cx - 10} ${y + h * 0.7} L${cx - 10} ${y + h * 0.55} M${cx + 10} ${y + h * 0.7} L${cx + 10} ${y + h * 0.55}`} />
    </g>
  );
}
