// Human labels for stored enum values. One place, so the API, compare rows and chips all agree.
import type { RoomType } from '../../../shared/types'

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  single: 'Single room',
  double: 'Double sharing',
  triple: 'Triple sharing',
  dorm: 'Dorm',
}

export function roomLabel(room: { room_type: RoomType; occupancy: number; ac?: number | boolean; attached_bathroom?: number | boolean }) {
  const base = room.room_type === 'dorm' ? `${room.occupancy}-bed dorm` : ROOM_TYPE_LABEL[room.room_type]
  const extras = [room.ac ? 'AC' : 'Non-AC', room.attached_bathroom ? 'attached bathroom' : null].filter(Boolean)
  return `${base} · ${extras.join(' · ')}`
}

export const LABELS: Record<string, Record<string, string>> = {
  type: { PG: 'PG', Hostel: 'Hostel', 'Shared Rental': 'Shared rental' },
  gender_policy: { women_only: 'Women only', men_only: 'Men only', mixed: 'Mixed (separate floors)' },
  occupant_focus: { working_professionals: 'Working professionals', students: 'Students', both: 'Students and professionals' },
  room_type: { single: 'Single', double: 'Double', triple: 'Triple', dorm: 'Dorm' },
  curfew_type: { none: 'No curfew', flexible: 'Flexible', fixed: 'Fixed' },
  late_entry: { none: 'No late entry', with_permission: 'With permission', flexible: 'Flexible' },
  visitors: { not_allowed: 'Not allowed', reception_only: 'Reception only', daytime_only: 'Daytime only', with_notice: 'With notice' },
  food_included: { included: 'Included in rent', optional: 'Optional mess', none: 'No food service' },
  veg_options: { veg_only: 'Veg only', non_veg_allowed: 'Non-veg allowed', both: 'Veg and non-veg' },
  cuisine: { kerala: 'Kerala', north_indian: 'North Indian', south_indian: 'South Indian', mixed: 'Mixed' },
  cctv: { none: 'No CCTV', entrance_only: 'Entrance only', common_areas: 'Common areas', extensive: 'Extensive' },
  security_guard: { none: 'No guard', night_only: 'Night only', '24x7': '24x7' },
  garbage_collection: { daily: 'Daily', alternate_days: 'Alternate days', twice_weekly: 'Twice a week', weekly: 'Weekly' },
  electricity_policy: { included: 'Included in rent', metered: 'Metered, paid separately', fixed_fee: 'Fixed monthly fee' },
  coverage: { rooms: 'Rooms', common_areas: 'Common areas only', rooms_and_common_areas: 'Rooms and common areas' },
  verification_status: { verified: 'Verified by Havenly', partially_verified: 'Partly verified', not_verified: 'Not yet verified' },
  booking_status: {
    submitted: 'Request recorded',
    owner_notified: 'Owner notified (simulated)',
    accepted: 'Accepted by owner (simulated)',
    declined: 'Declined by owner (simulated)',
    expired: 'Expired without a response',
    cancelled_by_user: 'Cancelled by you',
  },
}

export const label = (group: string, value: string | null | undefined) => (value == null ? '—' : LABELS[group]?.[value] ?? value)

export const time12 = (hhmm: string | null) => {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
