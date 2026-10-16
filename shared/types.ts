// API contract shared by the server (/server) and the React client (/src).
// Keep this file free of runtime imports so both sides can use it.

export type PropertyType = 'PG' | 'Hostel' | 'Shared Rental'
export type GenderPolicy = 'women_only' | 'men_only' | 'mixed'
export type OccupantFocus = 'working_professionals' | 'students' | 'both'
export type RoomType = 'single' | 'double' | 'triple' | 'dorm'
export type VerificationStatus = 'not_verified' | 'partially_verified' | 'verified'
export type FactSource = 'owner_listed' | 'platform_verified' | 'resident_reported'
export type DataSource = 'demo_seed' | 'manual_verified' | 'user_submitted'
export type BookingStatus = 'submitted' | 'owner_notified' | 'accepted' | 'declined' | 'expired' | 'cancelled_by_user'
export type ReviewType = 'general' | 'tip' | 'expectation_vs_reality' | 'hidden_cost' | 'rule_experience' | 'safety_report'
export type ArtScene = 'building' | 'room' | 'window' | 'lobby' | 'kitchen' | 'terrace'

export interface ApiError {
  error: { code: string; message: string; details?: unknown }
}

// ---------- meta ----------

export interface AreaInfo {
  slug: string
  name: string
  district: string
  state: string
  status: 'active' | 'coming_soon'
}

export interface Meta {
  active_area: AreaInfo
  coming_soon: AreaInfo[]
  demo: boolean
  demo_notice: string | null
  /** Example searches built from the active area's own landmarks, so the UI never hardcodes place names. */
  example_searches: string[]
  payments_enabled: false
}

// ---------- filters (single source of truth) ----------

export type FilterKind = 'multi' | 'single' | 'boolean' | 'range' | 'commute'
export type FilterGroup =
  | 'place'
  | 'budget'
  | 'wifi_amenities'
  | 'food'
  | 'cleaning'
  | 'rules'
  | 'safety'
  | 'commute'
  | 'verification'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDef {
  key: string
  label: string
  group: FilterGroup
  kind: FilterKind
  options?: FilterOption[]
  /** For range filters: the query keys for each end. */
  range?: { min_key: string; max_key: string; min: number; max: number; step: number; presets: { label: string; min?: number; max?: number }[] }
  /** For commute: the second key carrying the minutes limit. */
  commute?: { minutes_key: string; mode_key: string; minutes: number[] }
  supported: boolean
  /** Shown next to safety items: where the per-property value comes from. */
  source_note?: string
  help?: string
}

export interface FilterGroupDef {
  key: FilterGroup
  label: string
}

export interface FiltersResponse {
  groups: FilterGroupDef[]
  filters: FilterDef[]
  sorts: FilterOption[]
}

/** Query params accepted by GET /api/properties. Values are strings as they travel in the URL. */
export type FilterValues = Record<string, string>

// ---------- properties ----------

export interface PropertySummary {
  id: string
  slug: string
  name: string
  type: PropertyType
  gender_policy: GenderPolicy
  occupant_focus: OccupantFocus
  sub_area: { slug: string; name: string }
  area: { slug: string; name: string }
  art: ArtScene
  from_rent: number
  rent_max: number
  security_deposit: number
  verification_status: VerificationStatus
  verified_badge: boolean
  last_verified_at: string | null
  rating: number | null
  review_count: number
  beds_available: number
  food_included: 'included' | 'optional' | 'none'
  curfew_type: 'none' | 'flexible' | 'fixed'
  gate_close_time: string | null
  wifi: { free: boolean; speed_mbps: number }
  room_types: RoomType[]
  has_ac_rooms: boolean
  reported_difference_count: number
  top_reported_difference: string | null
  nearest: { landmark: string; minutes_auto: number; minutes_walk: number } | null
  data_source: DataSource
}

export interface FacetCounts {
  [filterKey: string]: { [value: string]: number }
}

export interface PropertyListResponse {
  total: number
  page: number
  limit: number
  results: PropertySummary[]
  facets: FacetCounts
  applied: FilterValues
  ignored: string[]
}

export interface Fact {
  field: string
  label: string
  value: string | number | boolean | null
  display: string
  source: FactSource
  evidence_type: string | null
  verified_at: string | null
  note: string | null
  resident_reports: string | null
}

export interface RoomInventoryItem {
  id: string
  room_type: RoomType
  label: string
  occupancy: number
  ac: boolean
  attached_bathroom: boolean
  furnished: boolean
  rent_per_bed: number
  mess_cost_per_month: number | null
  total_beds: number
  available_beds: number
  next_available_date: string | null
  availability_updated_at: string
  waitlist_open: boolean
  status: 'available' | 'full_waitlist' | 'full'
}

export interface ReportedDifference {
  id: string
  field_name: string
  title: string
  listed_value: string
  reported_summary: string
  supporting_review_count: number
  supporting_review_ids: string[]
  status: 'active' | 'owner_responded' | 'resolved'
  owner_response: string | null
}

export interface CommuteItem {
  landmark: { slug: string; name: string; kind: string }
  minutes_walk: number
  minutes_auto: number
  minutes_bus: number
  distance_km: number
}

export interface CategorySummary {
  key: string
  label: string
  average: number | null
  count: number
}

export interface ReviewSummary {
  count: number
  average: number | null
  enough: boolean
  message: string | null
  categories: CategorySummary[]
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>
  verified_resident_count: number
}

export interface OtherCharge {
  name: string
  amount: number
  frequency: 'monthly' | 'one_time' | 'yearly'
  refundable: boolean
}

export interface PropertyDetail extends PropertySummary {
  description: string
  address_line: string
  lat: number
  lng: number
  year_established: number | null
  floors: number | null
  costs: {
    security_deposit: number
    advance_months: number
    maintenance_charge: number
    electricity_policy: 'included' | 'metered' | 'fixed_fee'
    electricity_label: string
    other_charges: OtherCharge[]
    notice_period_days: number
    notice_terms: string | null
    min_stay_months: number
    max_stay_months: number
  }
  amenities: { id: string; label: string; icon: string; note: string | null }[]
  facts: {
    wifi: Fact[]
    food: Fact[]
    cleaning: Fact[]
    rules: Fact[]
    safety: Fact[]
  }
  source_counts: Record<FactSource, number>
  rooms: RoomInventoryItem[]
  commute: CommuteItem[]
  reported_differences: ReportedDifference[]
  review_summary: ReviewSummary
}

// ---------- reviews ----------

export interface Review {
  id: string
  property: { slug: string; name: string; type: PropertyType; sub_area: string; art: ArtScene }
  display_name: string
  overall_rating: number
  ratings: Partial<Record<string, number>>
  title: string
  body: string
  review_type: ReviewType
  stay_start: string | null
  stay_end: string | null
  currently_staying: boolean
  verified_resident: boolean
  helpful_count: number
  themes: string[]
  created_at: string
  is_sample: boolean
}

export interface ReviewListResponse {
  total: number
  results: Review[]
}

export interface NewReviewInput {
  property_slug: string
  overall_rating: number
  ratings?: Partial<Record<string, number>>
  title: string
  body: string
  review_type: ReviewType
  stay_start?: string
  stay_end?: string
  currently_staying?: boolean
}

// ---------- search interpretation ----------

export interface InterpretChip {
  key: string
  value: string
  label: string
}

export interface InterpretResult {
  query: string
  filters: FilterValues
  chips: InterpretChip[]
  unsupported: { text: string; reason: string }[]
  clarification: string | null
  out_of_coverage: { place: string; message: string; coming_soon: boolean; area_slug: string | null } | null
}

// ---------- compare ----------

export interface CompareRow {
  key: string
  label: string
  group: string
  values: (string | null)[]
  sources: (FactSource | null)[]
  differs: boolean
  best_index: number | null
}

export interface CompareResponse {
  properties: PropertySummary[]
  rows: CompareRow[]
  note: string
}

// ---------- booking ----------

export interface EstimateInput {
  room_type: RoomType
  move_in_date: string
  duration_months: number
  include_mess: boolean
}

export interface EstimateLine {
  key: string
  label: string
  amount: number
  detail: string
  refundable: boolean
  kind: 'rent' | 'mess' | 'recurring' | 'one_time' | 'deposit'
}

export interface Estimate {
  property_slug: string
  room_type: RoomType
  room_label: string
  move_in_date: string
  duration_months: number
  include_mess: boolean
  lines: EstimateLine[]
  estimated_total: number
  refundable_total: number
  non_refundable_total: number
  due_at_move_in: number
  notes: string[]
  resident_reported_costs: string[]
  computed_at: string
}

export interface BookingRequest {
  id: string
  reference: string
  property: { slug: string; name: string; sub_area: string; art: ArtScene }
  room_type: RoomType
  room_label: string
  occupancy: number
  move_in_date: string
  duration_months: number
  estimate: Estimate
  status: BookingStatus
  status_label: string
  status_history: { status: BookingStatus; at: string; by: string; note: string | null }[]
  note_from_user: string | null
  expires_at: string
  created_at: string
  simulated: boolean
  data_source: DataSource
}

// ---------- auth ----------

export interface DemoUser {
  id: string
  display_name: string
  email: string
}

export interface LoginResponse {
  token: string
  user: DemoUser
}
