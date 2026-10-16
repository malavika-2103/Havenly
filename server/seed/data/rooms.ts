// Room inventory per property. Availability is "as last updated by the listing", never live.
// Quotas: two room types are full with waitlist_open (tulsi single, coconut single);
// Lotus Residency is entirely full (no-vacancy state).
export interface RoomSeed {
  room_type: 'single' | 'double' | 'triple' | 'dorm'
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
}

const room = (
  room_type: RoomSeed['room_type'],
  occupancy: number,
  rent_per_bed: number,
  total_beds: number,
  available_beds: number,
  opts: Partial<RoomSeed> & { updated: string },
): RoomSeed => ({
  room_type,
  occupancy,
  ac: false,
  attached_bathroom: false,
  furnished: true,
  rent_per_bed,
  mess_cost_per_month: null,
  total_beds,
  available_beds,
  next_available_date: null,
  waitlist_open: false,
  ...opts,
  availability_updated_at: opts.updated,
})

export const rooms: Record<string, RoomSeed[]> = {
  'tulsi-nest-womens-pg': [
    room('single', 1, 13500, 8, 0, { ac: true, attached_bathroom: true, waitlist_open: true, next_available_date: '2026-12-01', updated: '2026-10-14T09:00:00.000Z' }),
    room('double', 2, 10200, 24, 3, { ac: true, attached_bathroom: true, updated: '2026-10-14T09:00:00.000Z' }),
  ],
  'kayal-house-ladies-hostel': [
    room('double', 2, 7500, 16, 2, { updated: '2026-10-12T08:00:00.000Z' }),
    room('triple', 3, 6200, 24, 4, { updated: '2026-10-12T08:00:00.000Z' }),
    room('dorm', 4, 5200, 20, 3, { updated: '2026-10-12T08:00:00.000Z' }),
  ],
  'coconut-grove-coliving': [
    room('single', 1, 19500, 10, 0, { ac: true, attached_bathroom: true, waitlist_open: true, next_available_date: '2026-11-20', updated: '2026-10-15T07:30:00.000Z' }),
    room('double', 2, 14500, 20, 2, { ac: true, attached_bathroom: true, updated: '2026-10-15T07:30:00.000Z' }),
  ],
  'mango-leaf-pg-for-women': [
    room('double', 2, 6800, 4, 1, { updated: '2026-10-09T10:00:00.000Z' }),
    room('triple', 3, 5500, 9, 3, { updated: '2026-10-09T10:00:00.000Z' }),
  ],
  'harbour-line-mens-hostel': [
    room('single', 1, 12000, 6, 2, { attached_bathroom: true, mess_cost_per_month: 3200, updated: '2026-10-13T12:00:00.000Z' }),
    room('double', 2, 9500, 22, 4, { ac: true, mess_cost_per_month: 3200, updated: '2026-10-13T12:00:00.000Z' }),
  ],
  'nila-womens-hostel': [
    room('dorm', 6, 4500, 30, 5, { updated: '2026-10-06T09:00:00.000Z' }),
    room('triple', 3, 5200, 12, 2, { updated: '2026-10-06T09:00:00.000Z' }),
  ],
  'jasmine-court-working-womens-pg': [
    room('single', 1, 11500, 5, 1, { attached_bathroom: true, mess_cost_per_month: 3500, updated: '2026-10-11T10:00:00.000Z' }),
    room('double', 2, 8800, 18, 3, { mess_cost_per_month: 3500, updated: '2026-10-11T10:00:00.000Z' }),
  ],
  'palm-shade-mens-hostel': [
    room('triple', 3, 4800, 15, 2, { updated: '2026-10-05T09:00:00.000Z' }),
    room('double', 2, 6000, 8, 2, { updated: '2026-10-05T09:00:00.000Z' }),
  ],
  'lotus-residency-for-women': [
    room('single', 1, 15500, 6, 0, { ac: true, attached_bathroom: true, next_available_date: '2026-12-01', updated: '2026-10-10T09:00:00.000Z' }),
    room('double', 2, 11800, 16, 0, { ac: true, next_available_date: '2026-12-15', updated: '2026-10-10T09:00:00.000Z' }),
  ],
  'kaithari-shared-homes': [
    room('single', 1, 12500, 2, 1, { attached_bathroom: true, updated: '2026-10-08T09:00:00.000Z' }),
    room('double', 2, 9500, 4, 2, { updated: '2026-10-08T09:00:00.000Z' }),
  ],
  'anjili-womens-hostel': [
    room('double', 2, 7200, 14, 3, { updated: '2026-10-07T09:00:00.000Z' }),
    room('triple', 3, 6000, 18, 4, { updated: '2026-10-07T09:00:00.000Z' }),
  ],
  'greenline-mens-hostel': [
    room('dorm', 4, 5500, 24, 6, { mess_cost_per_month: 3000, updated: '2026-10-15T09:00:00.000Z' }),
    room('double', 2, 7800, 12, 4, { ac: true, mess_cost_per_month: 3000, updated: '2026-10-15T09:00:00.000Z' }),
  ],
  'sandalwood-suites-womens-pg': [
    room('single', 1, 18500, 10, 2, { ac: true, attached_bathroom: true, updated: '2026-10-14T15:00:00.000Z' }),
    room('double', 2, 14800, 16, 1, { ac: true, attached_bathroom: true, updated: '2026-10-14T15:00:00.000Z' }),
  ],
  'thenmala-shared-house': [
    room('double', 2, 6500, 6, 2, { updated: '2026-10-02T09:00:00.000Z' }),
    room('triple', 3, 5000, 6, 1, { updated: '2026-10-02T09:00:00.000Z' }),
  ],
  'ixora-ladies-pg': [
    room('double', 2, 6800, 10, 2, { updated: '2026-10-10T11:00:00.000Z' }),
    room('triple', 3, 5800, 12, 2, { updated: '2026-10-10T11:00:00.000Z' }),
  ],
  'rosewood-shared-flats': [
    room('single', 1, 10500, 3, 1, { ac: true, attached_bathroom: true, updated: '2026-10-12T09:00:00.000Z' }),
    room('double', 2, 8000, 4, 2, { updated: '2026-10-12T09:00:00.000Z' }),
  ],
}
