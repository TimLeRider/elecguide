import type { ReactNode, SVGProps } from 'react';
import type { CatalogIcon } from '../rules/catalog';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconBolt = (p: IconProps) => (
  <Base {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
  </Base>
);
export const IconBulb = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.5-1.6 1.1-2.1A6 6 0 0 0 12 3z" />
  </Base>
);
export const IconTwoWay = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="7" width="7" height="10" rx="1.5" />
    <rect x="14.5" y="7" width="7" height="10" rx="1.5" />
    <path d="M9.5 10h5M9.5 14h5" />
  </Base>
);
export const IconRemote = (p: IconProps) => (
  <Base {...p}>
    <rect x="6" y="3" width="12" height="18" rx="2" />
    <circle cx="12" cy="10" r="2.5" />
    <path d="M9 16h6" />
  </Base>
);
export const IconPlug = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" />
    <path d="M12 6v2" />
  </Base>
);
export const IconPlugSwitch = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="13" r="6.5" />
    <circle cx="7" cy="13" r="1" fill="currentColor" />
    <circle cx="11" cy="13" r="1" fill="currentColor" />
    <path d="M17 4l4 4M19 6l-3.5 3.5" />
  </Base>
);
export const IconOven = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 8h18" />
    <rect x="7" y="11" width="10" height="6" rx="1" />
    <path d="M7 5.5h.01M10 5.5h.01" />
  </Base>
);
export const IconWasher = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="2.5" width="16" height="19" rx="2" />
    <circle cx="12" cy="13.5" r="4.5" />
    <path d="M7.5 6h.01M10.5 6h.01" />
  </Base>
);
export const IconDishwasher = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="2.5" width="16" height="19" rx="2" />
    <path d="M4 7h16M8 11v6M12 11v6M16 11v6" />
  </Base>
);
export const IconCooktop = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <circle cx="8" cy="12" r="3" />
    <circle cx="16.5" cy="12" r="2" />
  </Base>
);
export const IconWaterHeater = (p: IconProps) => (
  <Base {...p}>
    <rect x="6" y="2.5" width="12" height="17" rx="5" />
    <path d="M10 19.5v2M14 19.5v2M12 8c-1.5 2-2.2 3-2.2 4a2.2 2.2 0 0 0 4.4 0c0-1-.7-2-2.2-4z" />
  </Base>
);
export const IconHeatPump = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <circle cx="9" cy="12" r="4" />
    <path d="M9 8v8M5 12h8M15.5 9h3M15.5 12h3M15.5 15h3" />
  </Base>
);
export const IconCar = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 16h14M4 16v-3l2-5h9l3 5h1.5a1 1 0 0 1 1 1V16" />
    <circle cx="7.5" cy="16.5" r="2" />
    <circle cx="16.5" cy="16.5" r="2" />
    <path d="M12 3.5 10.5 6h3L12 8.5" />
  </Base>
);
export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);
export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Base>
);
export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Base>
);
export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);
export const IconMinus = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14" />
  </Base>
);
export const IconPrinter = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14" width="10" height="7" rx="1" />
  </Base>
);
export const IconFileDown = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M12 12v6M9 15l3 3 3-3" />
  </Base>
);
export const IconTable = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M3 15h18M9 4v16" />
  </Base>
);
export const IconReset = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Base>
);
export const IconShield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);
export const IconAlert = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v4M12 17h.01" />
  </Base>
);
export const IconInfo = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Base>
);
export const IconX = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);
export const IconHelp = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01" />
  </Base>
);
export const IconBoard = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 10h18M7 6.5h.01M7 13v4M10.5 13v4M14 13v4M17.5 13v4" />
  </Base>
);

const MAP: Record<CatalogIcon, (p: IconProps) => JSX.Element> = {
  bulb: IconBulb,
  twoway: IconTwoWay,
  remote: IconRemote,
  plug: IconPlug,
  plugSwitch: IconPlugSwitch,
  oven: IconOven,
  washer: IconWasher,
  dishwasher: IconDishwasher,
  cooktop: IconCooktop,
  waterHeater: IconWaterHeater,
  heatPump: IconHeatPump,
  car: IconCar,
};

export function CatalogIconView({ icon, size }: { icon: CatalogIcon; size?: number }) {
  const C = MAP[icon];
  return <C size={size} />;
}
