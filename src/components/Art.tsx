/**
 * Cozy flat-illustration "photos" for properties, drawn in the Havenly palette.
 * Rendered as full-bleed SVGs that scale to their container.
 */

type Scene = 'building' | 'room' | 'window' | 'lobby' | 'kitchen' | 'terrace'

const P = {
  plum: '#923B5D',
  plumDeep: '#6E2A46',
  mauve: '#B6728B',
  mauveSoft: '#D3A3B4',
  sage: '#AABAAF',
  sageSoft: '#CDD6CB',
  cream: '#E2D6BE',
  creamSoft: '#F0E7D6',
  olive: '#A0977A',
  paper: '#FBF5EC',
  white: '#FFFDF9',
}

function BuildingScene() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="400" height="300" fill={P.creamSoft} />
      <circle cx="322" cy="62" r="34" fill={P.cream} />
      {/* main building */}
      <rect x="112" y="74" width="176" height="200" rx="8" fill={P.mauve} />
      <rect x="112" y="74" width="176" height="200" rx="8" fill="none" stroke={P.plum} strokeWidth="3" />
      <path d="M104 82 200 30l96 52" fill={P.plum} strokeLinejoin="round" stroke={P.plum} strokeWidth="6" />
      {/* windows */}
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={132 + c * 38}
            y={98 + r * 42}
            width="26"
            height="26"
            rx="5"
            fill={(r + c) % 3 === 0 ? P.cream : P.creamSoft}
          />
        )),
      )}
      {/* door */}
      <path d="M186 274v-44a14 14 0 0 1 28 0v44z" fill={P.plumDeep} />
      <circle cx="208" cy="248" r="2.6" fill={P.cream} />
      {/* tree */}
      <rect x="330" y="216" width="10" height="58" rx="4" fill={P.olive} />
      <circle cx="335" cy="196" r="36" fill={P.sage} />
      <circle cx="312" cy="212" r="24" fill={P.sageSoft} />
      <circle cx="358" cy="212" r="22" fill={P.sageSoft} />
      {/* ground */}
      <rect y="274" width="400" height="26" fill={P.olive} opacity="0.55" />
      <path d="M40 300c10-26 30-34 48-30s24 16 20 30z" fill={P.sage} />
      <rect x="56" y="252" width="8" height="26" rx="3" fill={P.olive} />
    </svg>
  )
}

function RoomScene() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="400" height="300" fill={P.paper} />
      <rect y="216" width="400" height="84" fill={P.cream} />
      {/* window */}
      <path d="M232 34h84a10 10 0 0 1 10 10v104H222V44a10 10 0 0 1 10-10z" fill={P.sageSoft} stroke={P.olive} strokeWidth="3" />
      <path d="M274 34v114M222 90h104" stroke={P.olive} strokeWidth="3" />
      <circle cx="300" cy="62" r="13" fill={P.cream} />
      {/* curtains */}
      <path d="M214 30h14v122h-14c4-38 2-84 0-122z" fill={P.mauveSoft} />
      <path d="M320 30h14v122h-14c4-38 2-84 0-122z" fill={P.mauveSoft} />
      {/* bed */}
      <rect x="44" y="168" width="168" height="72" rx="10" fill={P.mauve} />
      <rect x="44" y="146" width="26" height="94" rx="10" fill={P.plum} />
      <rect x="80" y="146" width="64" height="34" rx="12" fill={P.creamSoft} />
      <rect x="44" y="196" width="168" height="18" fill={P.plumDeep} opacity="0.25" />
      <rect x="30" y="238" width="198" height="14" rx="6" fill={P.olive} />
      {/* side table + lamp */}
      <rect x="238" y="186" width="52" height="52" rx="8" fill={P.cream} stroke={P.olive} strokeWidth="2.5" />
      <rect x="258" y="150" width="8" height="36" rx="3" fill={P.olive} />
      <path d="M244 150h36l-8-22h-20z" fill={P.plum} />
      {/* plant */}
      <path d="M356 240v-28" stroke={P.olive} strokeWidth="5" strokeLinecap="round" />
      <circle cx="342" cy="204" r="17" fill={P.sage} />
      <circle cx="370" cy="200" r="15" fill={P.sageSoft} />
      <path d="M342 240h28l-4 30h-20z" fill={P.mauve} />
      {/* rug */}
      <ellipse cx="200" cy="280" rx="150" ry="14" fill={P.mauveSoft} opacity="0.5" />
    </svg>
  )
}

function WindowScene() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="400" height="300" fill={P.creamSoft} />
      {/* arch window */}
      <path d="M92 286V150a108 108 0 0 1 216 0v136z" fill={P.white} stroke={P.mauve} strokeWidth="6" />
      <clipPath id="archclip">
        <path d="M100 280V152a100 100 0 0 1 200 0v128z" />
      </clipPath>
      <g clipPath="url(#archclip)">
        <rect x="100" y="52" width="200" height="230" fill={P.creamSoft} />
        <circle cx="240" cy="118" r="24" fill={P.cream} />
        {/* city silhouette */}
        <rect x="112" y="176" width="34" height="104" fill={P.mauveSoft} />
        <rect x="152" y="146" width="44" height="134" fill={P.mauve} />
        <rect x="202" y="192" width="30" height="88" fill={P.sage} />
        <rect x="238" y="164" width="52" height="116" fill={P.sageSoft} />
        {[0, 1, 2].map((r) =>
          [0, 1].map((c) => (
            <rect key={`w${r}${c}`} x={160 + c * 20} y={158 + r * 26} width="12" height="14" rx="2" fill={P.creamSoft} />
          )),
        )}
        {[0, 1].map((r) =>
          [0, 1].map((c) => (
            <rect key={`v${r}${c}`} x={248 + c * 22} y={178 + r * 28} width="13" height="15" rx="2" fill={P.white} />
          )),
        )}
        {/* bushes */}
        <circle cx="130" cy="266" r="26" fill={P.sage} />
        <circle cx="284" cy="270" r="22" fill={P.sageSoft} />
      </g>
      {/* branch */}
      <path d="M300 92c-26 6-44 22-52 44" stroke={P.olive} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={i}
          cx={292 - i * 15}
          cy={96 + i * 11}
          rx="9"
          ry="5"
          fill={P.sage}
          transform={`rotate(${-28 + i * 8} ${292 - i * 15} ${96 + i * 11})`}
        />
      ))}
      {/* sparkle */}
      <path d="M64 84v22M53 95h22" stroke={P.mauve} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

function LobbyScene() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="400" height="300" fill={P.paper} />
      <rect y="222" width="400" height="78" fill={P.cream} />
      {/* wall art */}
      <rect x="60" y="46" width="62" height="76" rx="6" fill={P.creamSoft} stroke={P.olive} strokeWidth="3" />
      <path d="M70 106l16-24 12 16 10-12 8 20z" fill={P.sage} />
      <circle cx="104" cy="68" r="7" fill={P.cream} />
      {/* sofa */}
      <rect x="132" y="146" width="176" height="76" rx="16" fill={P.mauve} />
      <rect x="132" y="122" width="176" height="42" rx="14" fill={P.mauveSoft} />
      <rect x="118" y="150" width="26" height="72" rx="12" fill={P.plum} />
      <rect x="296" y="150" width="26" height="72" rx="12" fill={P.plum} />
      <rect x="168" y="132" width="46" height="30" rx="9" fill={P.creamSoft} />
      <rect x="224" y="132" width="46" height="30" rx="9" fill={P.creamSoft} />
      {/* table */}
      <rect x="176" y="244" width="92" height="12" rx="6" fill={P.olive} />
      <rect x="196" y="222" width="8" height="24" rx="3" fill={P.olive} />
      <rect x="240" y="222" width="8" height="24" rx="3" fill={P.olive} />
      <path d="M204 214h26l-5 10h-16z" fill={P.plum} />
      {/* plants */}
      <path d="M52 264v-30" stroke={P.olive} strokeWidth="5" strokeLinecap="round" />
      <circle cx="52" cy="222" r="20" fill={P.sage} />
      <circle cx="36" cy="234" r="13" fill={P.sageSoft} />
      <path d="M40 264h24l-4 26H44z" fill={P.mauve} />
      <rect x="330" y="196" width="44" height="68" rx="8" fill={P.cream} stroke={P.olive} strokeWidth="2.5" />
      <circle cx="352" cy="182" r="16" fill={P.sage} />
    </svg>
  )
}

function KitchenScene() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="400" height="300" fill={P.creamSoft} />
      <rect y="238" width="400" height="62" fill={P.olive} opacity="0.5" />
      {/* backsplash */}
      <rect x="30" y="70" width="340" height="98" fill={P.paper} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3, 4, 5].map((c) => (
          <rect key={`t${r}${c}`} x={34 + c * 56} y={74 + r * 32} width="52" height="28" rx="4" fill={P.white} stroke={P.cream} strokeWidth="2" />
        )),
      )}
      {/* upper cabinets */}
      <rect x="30" y="30" width="150" height="42" rx="6" fill={P.mauve} />
      <rect x="220" y="30" width="150" height="42" rx="6" fill={P.mauve} />
      <circle cx="170" cy="51" r="3" fill={P.cream} />
      <circle cx="232" cy="51" r="3" fill={P.cream} />
      {/* counter */}
      <rect x="20" y="166" width="360" height="18" rx="6" fill={P.olive} />
      <rect x="30" y="184" width="340" height="54" fill={P.cream} />
      <rect x="120" y="188" width="8" height="46" rx="3" fill={P.olive} opacity="0.6" />
      <rect x="238" y="188" width="8" height="46" rx="3" fill={P.olive} opacity="0.6" />
      {/* stove + pot */}
      <rect x="60" y="146" width="86" height="20" rx="5" fill={P.plumDeep} />
      <circle cx="80" cy="156" r="4" fill={P.cream} />
      <circle cx="104" cy="156" r="4" fill={P.cream} />
      <path d="M76 146v-12h34v12z" fill={P.plum} />
      <path d="M84 128c2-8 16-8 18 0" stroke={P.mauveSoft} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* shelf items */}
      <rect x="240" y="128" width="16" height="38" rx="4" fill={P.sage} />
      <rect x="262" y="138" width="14" height="28" rx="4" fill={P.sageSoft} />
      <rect x="282" y="120" width="18" height="46" rx="5" fill={P.mauveSoft} />
      {/* plant */}
      <path d="M344 164v-24" stroke={P.olive} strokeWidth="4" strokeLinecap="round" />
      <circle cx="344" cy="128" r="17" fill={P.sage} />
      <path d="M334 164h20l-3 22h-14z" fill={P.plum} />
    </svg>
  )
}

function TerraceScene() {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <rect width="400" height="300" fill={P.creamSoft} />
      <circle cx="94" cy="72" r="30" fill={P.cream} />
      {/* distant buildings */}
      <rect x="20" y="120" width="52" height="92" fill={P.mauveSoft} />
      <rect x="80" y="96" width="44" height="116" fill={P.mauve} />
      <rect x="300" y="106" width="56" height="106" fill={P.sageSoft} />
      <rect x="362" y="132" width="38" height="80" fill={P.sage} />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => (
          <rect key={`b${r}${c}`} x={88 + c * 20} y={108 + r * 30} width="12" height="16" rx="2" fill={P.creamSoft} />
        )),
      )}
      {/* floor */}
      <rect y="212" width="400" height="88" fill={P.paper} />
      <path d="M0 234h400M0 258h400M0 282h400" stroke={P.cream} strokeWidth="3" />
      {/* railing */}
      <rect y="196" width="400" height="8" rx="4" fill={P.olive} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={20 + i * 50} y="196" width="6" height="30" rx="3" fill={P.olive} opacity="0.8" />
      ))}
      {/* chairs + table */}
      <rect x="150" y="238" width="70" height="10" rx="5" fill={P.plum} />
      <rect x="160" y="248" width="6" height="26" rx="3" fill={P.plumDeep} />
      <rect x="204" y="248" width="6" height="26" rx="3" fill={P.plumDeep} />
      <path d="M126 264h34v-26h-34z" fill={P.mauve} />
      <rect x="122" y="238" width="8" height="30" rx="4" fill={P.plum} />
      <rect x="238" y="238" width="34" height="26" rx="6" fill={P.mauve} />
      <rect x="270" y="232" width="8" height="32" rx="4" fill={P.plum} />
      {/* plants along railing */}
      <path d="M320 226v-26" stroke={P.olive} strokeWidth="5" strokeLinecap="round" />
      <circle cx="320" cy="188" r="19" fill={P.sage} />
      <path d="M308 226h24l-4 24h-16z" fill={P.mauve} />
      <circle cx="44" cy="210" r="16" fill={P.sageSoft} />
      <path d="M34 226h20l-3 18H37z" fill={P.olive} />
    </svg>
  )
}

const scenes: Record<Scene, () => JSX.Element> = {
  building: BuildingScene,
  room: RoomScene,
  window: WindowScene,
  lobby: LobbyScene,
  kitchen: KitchenScene,
  terrace: TerraceScene,
}

export default function Art({ variant, className }: { variant: Scene; className?: string }) {
  const Scene = scenes[variant] ?? BuildingScene
  return (
    <div className={className} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Scene />
    </div>
  )
}

export const GALLERY_SCENES: Scene[] = ['building', 'room', 'window', 'lobby', 'kitchen', 'terrace']
