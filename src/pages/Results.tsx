import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import PropertyCard from '../components/PropertyCard'
import { properties, Property, PropertyType } from '../data/properties'
import { parseQuery } from '../lib/search'
import { Sliders, X, Shield, Search as SearchIcon, MapPin } from '../components/Icons'

type SortKey = 'relevance' | 'price-low' | 'rating-high'

const TYPES: PropertyType[] = ['PG', 'Hostel', 'Shared Rental']
const CURFEWS = ['No curfew', 'Flexible', 'Fixed']
const WIFI = ['Excellent', 'Good', 'Average']
const FOOD_OPTS = ['yes', 'no']
const GARBAGE = ['Daily', 'Alternate days', 'Weekly']
const CLEANING = ['Daily housekeeping', 'Weekly', 'Self-service']
const ROOMS = ['Single sharing', 'Double sharing', 'Triple sharing', '1 BHK', 'Studio']

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

export default function Results() {
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<SortKey>('relevance')
  const [showFilters, setShowFilters] = useState(false)

  // ---- filter state, seeded from URL ----
  const [types, setTypes] = useState<PropertyType[]>(() =>
    params.get('type') ? [params.get('type') as PropertyType] : [],
  )
  const [minRent, setMinRent] = useState(() => Number(params.get('min') ?? 0))
  const [maxRent, setMaxRent] = useState(() => Number(params.get('max') ?? 30000))
  const [curfews, setCurfews] = useState<string[]>(() => (params.get('curfew') ? [params.get('curfew')!] : []))
  const [wifiOpts, setWifiOpts] = useState<string[]>([])
  const [food, setFood] = useState<string | null>(() => params.get('food'))
  const [garbage, setGarbage] = useState<string[]>([])
  const [cleaning, setCleaning] = useState<string[]>([])
  const [rooms, setRooms] = useState<string[]>(() => (params.get('room') ? [params.get('room')!] : []))
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [acOnly, setAcOnly] = useState(() => params.get('ac') === 'yes')
  const [locality, setLocality] = useState<string | null>(() => params.get('locality'))
  const [city, setCity] = useState<string | null>(() => params.get('city'))
  const [q, setQ] = useState(() => params.get('q') ?? '')

  // keep filters in sync when a new search is submitted from the top bar
  useEffect(() => {
    setTypes(params.get('type') ? [params.get('type') as PropertyType] : [])
    setMinRent(Number(params.get('min') ?? 0))
    setMaxRent(Number(params.get('max') ?? 30000))
    setCurfews(params.get('curfew') ? [params.get('curfew')!] : [])
    setRooms(params.get('room') ? [params.get('room')!] : [])
    setFood(params.get('food'))
    setAcOnly(params.get('ac') === 'yes')
    setLocality(params.get('locality'))
    setCity(params.get('city'))
    setQ(params.get('q') ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

  const resetAll = () => {
    setTypes([])
    setMinRent(0)
    setMaxRent(30000)
    setCurfews([])
    setWifiOpts([])
    setFood(null)
    setGarbage([])
    setCleaning([])
    setRooms([])
    setMinRating(0)
    setVerifiedOnly(false)
    setAcOnly(false)
    setLocality(null)
    setCity(null)
    setQ('')
    setParams({})
  }

  const results = useMemo(() => {
    let list = properties.filter((p) => {
      if (types.length && !types.includes(p.type)) return false
      if (p.rent < minRent || p.rent > maxRent) return false
      if (curfews.length && !curfews.includes(p.curfew)) return false
      if (wifiOpts.length && !wifiOpts.includes(p.wifi)) return false
      if (food === 'yes' && p.food === 'Not included') return false
      if (food === 'no' && p.food === 'Included') return false
      if (garbage.length && !garbage.includes(p.garbage)) return false
      if (
        cleaning.length &&
        !cleaning.some((c) =>
          c === 'Daily housekeeping'
            ? /daily/i.test(p.cleaning)
            : c === 'Weekly'
              ? /weekly/i.test(p.cleaning)
              : /self/i.test(p.cleaning),
        )
      )
        return false
      if (rooms.length && !rooms.some((r) => p.roomTypes.some((pr) => pr.includes(r)))) return false
      if (p.rating < minRating) return false
      if (verifiedOnly && !p.verified) return false
      if (acOnly && !p.ac) return false
      if (locality && p.locality !== locality) return false
      if (city && p.city !== city) return false
      if (q) {
        const parsed = parseQuery(q)
        const hay = [
          p.name,
          p.locality,
          p.city,
          p.about,
          p.mess,
          p.roomTypes.join(' '),
          p.highlights.join(' '),
          p.reviews.map((r) => `${r.title} ${r.body}`).join(' '),
        ]
          .join(' ')
          .toLowerCase()

        // words the parser already turned into filters shouldn't be re-matched as keywords
        const covered = new Set<string>()
        if (locality) covered.add(locality.toLowerCase())
        if (city) covered.add(city.toLowerCase())
        if (parsed.type || types.length) ['pg', 'hostel', 'shared', 'rental', 'coliving', 'co-living'].forEach((w) => covered.add(w))
        if (food !== null || parsed.withFood !== undefined) ['food', 'mess', 'meals', 'tiffin'].forEach((w) => covered.add(w))
        if (acOnly) ['ac', 'air', 'conditioned'].forEach((w) => covered.add(w))
        if (curfews.length || parsed.curfew) ['curfew'].forEach((w) => covered.add(w))
        if (rooms.length || parsed.room) ['single', 'double', 'triple', 'sharing', 'bhk', 'studio'].forEach((w) => covered.add(w))

        const residual = parsed.terms.map((t) => t.toLowerCase()).filter((t) => !covered.has(t) && t.length > 2)
        // residual words (e.g. "quiet", "near Infopark") match softly — any one match keeps the place in
        if (residual.length > 0 && !residual.some((w) => hay.includes(w))) return false
      }
      return true
    })

    if (sort === 'price-low') list = [...list].sort((a, b) => a.rent - b.rent)
    if (sort === 'rating-high') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [types, minRent, maxRent, curfews, wifiOpts, food, garbage, cleaning, rooms, minRating, verifiedOnly, acOnly, locality, city, q, sort])

  // chips summarising active filters
  const chips: { label: string; clear: () => void }[] = [
    ...types.map((t) => ({ label: t, clear: () => setTypes(types.filter((x) => x !== t)) })),
    ...(locality ? [{ label: locality, clear: () => setLocality(null) }] : []),
    ...(city && !locality ? [{ label: city, clear: () => setCity(null) }] : []),
    ...(maxRent < 30000 || minRent > 0
      ? [{ label: `${inr(minRent)}–${inr(maxRent)}`, clear: () => { setMinRent(0); setMaxRent(30000) } }]
      : []),
    ...curfews.map((c) => ({ label: c === 'No curfew' ? 'No curfew' : `${c} curfew`, clear: () => setCurfews(curfews.filter((x) => x !== c)) })),
    ...wifiOpts.map((w) => ({ label: `WiFi ${w}`, clear: () => setWifiOpts(wifiOpts.filter((x) => x !== w)) })),
    ...(food ? [{ label: food === 'yes' ? 'With food' : 'Without food', clear: () => setFood(null) }] : []),
    ...rooms.map((r) => ({ label: r, clear: () => setRooms(rooms.filter((x) => x !== r)) })),
    ...garbage.map((g) => ({ label: `Garbage ${g.toLowerCase()}`, clear: () => setGarbage(garbage.filter((x) => x !== g)) })),
    ...cleaning.map((c) => ({ label: c, clear: () => setCleaning(cleaning.filter((x) => x !== c)) })),
    ...(minRating > 0 ? [{ label: `${minRating}★ & up`, clear: () => setMinRating(0) }] : []),
    ...(verifiedOnly ? [{ label: 'Verified only', clear: () => setVerifiedOnly(false) }] : []),
    ...(acOnly ? [{ label: 'AC rooms', clear: () => setAcOnly(false) }] : []),
  ]

  return (
    <>
      <div className="results-hero">
        <div className="container">
          <div className="results-search">
            <SearchBar compact initial={q} />
            <button className="btn btn-secondary filter-fab" onClick={() => setShowFilters((s) => !s)}>
              <Sliders size={17} /> Filters {chips.length > 0 && `(${chips.length})`}
            </button>
          </div>
          {q && (
            <div className="tiny muted" style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SearchIcon size={14} /> Interpreting your search: “{q}”
            </div>
          )}
        </div>
      </div>

      <div className="container results-layout">
        <aside className={`filter-panel${showFilters ? ' open' : ''}`}>
          <div className="filter-head">
            <h3>
              <Sliders size={18} /> Filters
            </h3>
            <button className="link-btn" onClick={resetAll}>
              Clear all
            </button>
          </div>
          <div className="filter-body">
            <div className="filter-group">
              <h4>Accommodation type</h4>
              <div className="pill-options">
                {TYPES.map((t) => (
                  <button key={t} className={`pill-option${types.includes(t) ? ' on' : ''}`} onClick={() => toggle(types, t, setTypes)}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Budget (monthly rent)</h4>
              <div className="range-row">
                <input
                  type="number"
                  placeholder="Min"
                  value={minRent || ''}
                  onChange={(e) => setMinRent(Number(e.target.value) || 0)}
                />
                <span className="muted">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxRent || ''}
                  onChange={(e) => setMaxRent(Number(e.target.value) || 30000)}
                />
              </div>
              <div className="pill-options" style={{ marginTop: 10 }}>
                {[
                  [0, 10000, '≤ ₹10k'],
                  [10000, 14000, '₹10k–14k'],
                  [14000, 18000, '₹14k–18k'],
                  [18000, 30000, '₹18k+'],
                ].map(([lo, hi, label]) => (
                  <button
                    key={label as string}
                    className={`pill-option${minRent === lo && maxRent === hi ? ' on' : ''}`}
                    onClick={() => {
                      setMinRent(lo as number)
                      setMaxRent(hi as number)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Curfew</h4>
              <div className="pill-options">
                {CURFEWS.map((c) => (
                  <button key={c} className={`pill-option${curfews.includes(c) ? ' on' : ''}`} onClick={() => toggle(curfews, c, setCurfews)}>
                    {c === 'No curfew' ? 'No curfew' : c}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>WiFi condition</h4>
              <div className="pill-options">
                {WIFI.map((w) => (
                  <button key={w} className={`pill-option${wifiOpts.includes(w) ? ' on' : ''}`} onClick={() => toggle(wifiOpts, w, setWifiOpts)}>
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Mess & food</h4>
              <div className="pill-options">
                {FOOD_OPTS.map((f) => (
                  <button
                    key={f}
                    className={`pill-option${food === f ? ' on' : ''}`}
                    onClick={() => setFood(food === f ? null : f)}
                  >
                    {f === 'yes' ? 'With food' : 'Without food'}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Garbage disposal</h4>
              <div className="pill-options">
                {GARBAGE.map((g) => (
                  <button key={g} className={`pill-option${garbage.includes(g) ? ' on' : ''}`} onClick={() => toggle(garbage, g, setGarbage)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Cleaning facilities</h4>
              <div className="pill-options">
                {CLEANING.map((c) => (
                  <button key={c} className={`pill-option${cleaning.includes(c) ? ' on' : ''}`} onClick={() => toggle(cleaning, c, setCleaning)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Room type</h4>
              <div className="pill-options">
                {ROOMS.map((r) => (
                  <button key={r} className={`pill-option${rooms.includes(r) ? ' on' : ''}`} onClick={() => toggle(rooms, r, setRooms)}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Reviews & ratings</h4>
              <div className="pill-options">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <button key={r} className={`pill-option${minRating === r ? ' on' : ''}`} onClick={() => setMinRating(r)}>
                    {r === 0 ? 'Any' : `${r}★+`}
                  </button>
                ))}
              </div>
              <label className="check-row" style={{ marginTop: 10 }}>
                <input type="checkbox" checked={verifiedOnly} onChange={() => setVerifiedOnly((v) => !v)} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={15} /> Platform-verified only
                </span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={acOnly} onChange={() => setAcOnly((v) => !v)} />
                AC rooms available
              </label>
            </div>
          </div>
        </aside>

        <section>
          <div className="results-toolbar">
            <span className="results-count">
              <b>{results.length}</b> {results.length === 1 ? 'place' : 'places'} found
              {locality ? ` in ${locality}` : city ? ` in ${city}` : ''}
            </span>
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="relevance">Sort: Recommended</option>
              <option value="price-low">Price: Low to high</option>
              <option value="rating-high">Rating: High to low</option>
            </select>
          </div>

          {chips.length > 0 && (
            <div className="active-chips">
              {chips.map((c, i) => (
                <button key={i} className="chip removable" onClick={c.clear}>
                  {c.label} <span className="x">×</span>
                </button>
              ))}
            </div>
          )}

          {results.length === 0 ? (
            <div className="empty-state">
              <MapPin size={34} style={{ color: 'var(--mauve)' }} />
              <h3>No places match all of that — yet</h3>
              <p className="muted">Try widening your budget or removing a filter or two.</p>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={resetAll}>
                <X size={16} /> Clear all filters
              </button>
            </div>
          ) : (
            results.map((p: Property) => <PropertyCard key={p.id} p={p} />)
          )}
        </section>
      </div>
    </>
  )
}
