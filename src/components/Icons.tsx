import { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, props: P) => ({
  width: props.size ?? size,
  height: props.size ?? size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export const Search = (p: P) => (
  <svg {...base(20, p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
)

export const Sparkle = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8.5 13.2 11 12 12.3 10.8 11z" fill="currentColor" stroke="none" />
  </svg>
)

export const Heart = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.6 12 20 12 20z" />
  </svg>
)

export const HeartFill = (p: P) => (
  <svg {...base(20, p)} fill="currentColor" stroke="none">
    <path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.6 12 20 12 20z" />
  </svg>
)

export const Scales = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 4v16M6 20h12M5 8h14M5 8l-2.5 6h5zM19 8l-2.5 6h5z" />
  </svg>
)

export const Shield = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const Users = (p: P) => (
  <svg {...base(20, p)}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
    <path d="M16 5.5a3 3 0 0 1 0 5.5M18 20c0-2.2-.7-3.7-2-4.6" />
  </svg>
)

export const Star = (p: P) => (
  <svg {...base(20, p)}>
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.5.9-5.2L4.5 9.6l5.2-.7z" />
  </svg>
)

export const StarFill = (p: P) => (
  <svg {...base(20, p)} fill="currentColor" stroke="none">
    <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16l-4.6 2.5.9-5.2L4.5 9.6l5.2-.7z" />
  </svg>
)

export const Sliders = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
)

export const MapPin = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" />
    <circle cx="12" cy="11" r="2.4" />
  </svg>
)

export const Wifi = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M10 16a4 4 0 0 1 4 0" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const Utensils = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11" />
    <path d="M17 3c-1.5 1.5-2 3.5-2 6 0 1.5.5 2.5 2 3v9" />
  </svg>
)

export const Moon = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </svg>
)

export const Broom = (p: P) => (
  <svg {...base(20, p)}>
    <path d="m14 4 6 6M13 8l-8 8-1 5 5-1 8-8" />
    <path d="m6.5 13.5 4 4" />
  </svg>
)

export const Trash = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
)

export const Power = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
  </svg>
)

export const Snowflake = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5 4.2 16.5" />
    <path d="m9.5 4.8 2.5 2 2.5-2M9.5 19.2l2.5-2 2.5 2" />
  </svg>
)

export const Bath = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
    <path d="M6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" />
  </svg>
)

export const Book = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M8 7h7M8 11h7" />
  </svg>
)

export const Water = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 3s6 6.5 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3 12 3z" />
  </svg>
)

export const Car = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M5 16v2M19 16v2M4 16h16v-4l-2-5H6l-2 5z" />
    <circle cx="8" cy="16" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

export const Elevator = (p: P) => (
  <svg {...base(20, p)}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="m9.5 9 1.2-1.6L11.9 9M12.1 15l1.2 1.6 1.2-1.6" />
  </svg>
)

export const Dumbbell = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />
  </svg>
)

export const Calendar = (p: P) => (
  <svg {...base(20, p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)

export const ArrowRight = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

export const Check = (p: P) => (
  <svg {...base(20, p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
)

export const AlertTriangle = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M12 4 3 19h18z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
)

export const Info = (p: P) => (
  <svg {...base(20, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

export const Camera = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="3.2" />
  </svg>
)

export const ThumbsUp = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 3 1.8V10h4.5a2 2 0 0 1 2 2.4l-1.2 6A2 2 0 0 1 17.3 20H7" />
  </svg>
)

export const ChevronDown = (p: P) => (
  <svg {...base(20, p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const X = (p: P) => (
  <svg {...base(20, p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const Menu = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const Laundry = (p: P) => (
  <svg {...base(20, p)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <circle cx="12" cy="14" r="4" />
    <path d="M8 6h.01M11 6h.01" />
  </svg>
)

export const Kitchen = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 3c-1.8 1.5-2.5 3.5-2.5 6.5 0 1.7.7 2.5 2.5 3v8.5" />
  </svg>
)

export const Terrace = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M4 20h16M6 20v-6M18 20v-6M3 14h18M8 14V9l4-4 4 4v5" />
  </svg>
)

export const Building = (p: P) => (
  <svg {...base(20, p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" />
  </svg>
)

export const House = (p: P) => (
  <svg {...base(20, p)}>
    <path d="m4 11 8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />
  </svg>
)

export const Bus = (p: P) => (
  <svg {...base(20, p)}>
    <rect x="4" y="4" width="16" height="13" rx="2" />
    <path d="M4 10h16M8 17v2M16 17v2" />
    <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
  </svg>
)

export const Key = (p: P) => (
  <svg {...base(20, p)}>
    <circle cx="8" cy="8" r="4" />
    <path d="m11 11 9 9M17 17l2-2M14 14l2-2" />
  </svg>
)

export const Clock = (p: P) => (
  <svg {...base(20, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const Eye = (p: P) => (
  <svg {...base(20, p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const iconMap: Record<string, (p: P) => JSX.Element> = {
  wifi: Wifi,
  power: Power,
  ac: Snowflake,
  laundry: Laundry,
  bath: Bath,
  study: Book,
  water: Water,
  parking: Car,
  lift: Elevator,
  gym: Dumbbell,
  kitchen: Kitchen,
  terrace: Terrace,
  broom: Broom,
  utensils: Utensils,
  moon: Moon,
  users: Users,
  calendar: Calendar,
  shield: Shield,
  bus: Bus,
}
