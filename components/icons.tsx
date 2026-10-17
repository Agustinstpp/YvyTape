/* Íconos de trazo, como en el mockup. Decorativos: aria-hidden. */
type Props = { size?: number; strokeWidth?: number };

function make(paths: React.ReactNode) {
  return function Icon({ size = 24, strokeWidth = 2.2 }: Props) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {paths}
      </svg>
    );
  };
}

export const IconHome = make(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>);
export const IconLots = make(<><path d="M8 4h8v3H8z" /><path d="M6 6H5v15h14V6h-1" /><path d="M9 12h6M9 16h6" /></>);
export const IconGroup = make(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.6" /><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8" /></>);
export const IconPerson = make(<><circle cx="12" cy="8" r="3.4" /><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /></>);
export const IconChat = make(<path d="M4 5h16v11H9l-5 4z" />);
export const IconSearch = make(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>);
export const IconTag = make(<><path d="M4 4h9l7 7-9 9-7-7z" /><circle cx="8.5" cy="8.5" r="1.5" /></>);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconCheck = make(<path d="M5 12.5l4.5 4.5L19 7" />);
export const IconX = make(<path d="M6 6l12 12M18 6L6 18" />);
export const IconArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const IconArrowLeft = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const IconChevron = make(<path d="M9 6l6 6-6 6" />);
export const IconBell = make(<><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>);
export const IconAlert = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></>);
export const IconInfo = make(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.01" /></>);
export const IconClock = make(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>);
export const IconPin = make(<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const IconTruck = make(<><path d="M2 6h11v10H2zM13 10h4l4 3v3h-8" /><circle cx="6" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /></>);
export const IconSend = make(<path d="M4 12l16-8-6 16-2-6z" />);
export const IconLock = make(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const IconLogout = make(<><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>);

export function Logo({ size = 40, onDark = true }: { size?: number; onDark?: boolean }) {
  const bg = onDark ? "#FFF8EC" : "#6B3E26";
  const road = onDark ? "#6B3E26" : "#FFF8EC";
  const marks = onDark ? "#F2B705" : "#E8751A";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill={bg} />
      <path d="M14 22a10 10 0 0 1 20 0z" fill="#F2B705" />
      <path d="M6 22h36" stroke={road} strokeWidth="2" />
      <path d="M21 22h6l9 20H12z" fill={road} />
      <path d="M24 25v3M24 31v4M24 38v3" stroke={marks} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
