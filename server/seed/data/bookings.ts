// A few sample booking requests from fictional users so the admin queue is not empty.
// The live demo user starts with none.
export interface BookingSeed {
  reference: string
  user: { name: string; email: string }
  property: string
  room_type: 'single' | 'double' | 'triple' | 'dorm'
  move_in_date: string
  duration_months: number
  include_mess: boolean
  status: 'submitted' | 'owner_notified' | 'accepted' | 'declined'
  note: string | null
  created: string
}

export const bookings: BookingSeed[] = [
  {
    reference: 'HV-3F7Q-9A2K',
    user: { name: 'Sample User One', email: 'sample-user-1@example.com' },
    property: 'kayal-house-ladies-hostel',
    room_type: 'double',
    move_in_date: '2026-11-15',
    duration_months: 6,
    include_mess: false,
    status: 'submitted',
    note: 'Joining a course at the college in November.',
    created: '2026-10-15T08:20:00.000Z',
  },
  {
    reference: 'HV-8M2K-4D7P',
    user: { name: 'Sample User Two', email: 'sample-user-2@example.com' },
    property: 'harbour-line-mens-hostel',
    room_type: 'double',
    move_in_date: '2026-11-01',
    duration_months: 6,
    include_mess: true,
    status: 'owner_notified',
    note: null,
    created: '2026-10-14T11:05:00.000Z',
  },
  {
    reference: 'HV-5R6T-3W8N',
    user: { name: 'Sample User Three', email: 'sample-user-3@example.com' },
    property: 'sandalwood-suites-womens-pg',
    room_type: 'single',
    move_in_date: '2026-11-05',
    duration_months: 12,
    include_mess: false,
    status: 'accepted',
    note: 'Starting at Infopark on 5 November.',
    created: '2026-10-12T16:40:00.000Z',
  },
]
