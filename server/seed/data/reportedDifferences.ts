// Differences between a listing and what residents report. Always phrased as reports, never verdicts.
// Each one cites at least two approved seed reviews (checked by validate.ts).
export interface ReportedDifferenceSeed {
  id: string
  property: string
  field_name: string
  title: string
  listed_value: string
  reported_summary: string
  supporting_review_ids: string[]
  status: 'active' | 'owner_responded' | 'resolved'
  owner_response: string | null
}

export const reportedDifferences: ReportedDifferenceSeed[] = [
  {
    id: 'diff_tulsi_hot_water',
    property: 'tulsi-nest-womens-pg',
    field_name: 'amenities.hot_water_24h',
    title: 'Residents report hot water is not always available in the morning',
    listed_value: '24-hour hot water (solar with backup geyser)',
    reported_summary: 'Three residents report that on rainy days the solar heater runs out by about 8 AM, and the backup geyser is switched on only when they ask.',
    supporting_review_ids: ['rev_tulsi_03', 'rev_tulsi_07', 'rev_tulsi_10'],
    status: 'active',
    owner_response: null,
  },
  {
    id: 'diff_kayal_curfew',
    property: 'kayal-house-ladies-hostel',
    field_name: 'rules.gate_close_time',
    title: 'Residents report the curfew is stricter than the listing implies',
    listed_value: 'Gate closes 9:30 PM. Late entry with permission',
    reported_summary: 'Three residents report the inner door is locked around 9:15 PM, and late entry needs a written note from a local guardian handed in the day before.',
    supporting_review_ids: ['rev_kayal_02', 'rev_kayal_05', 'rev_kayal_09'],
    status: 'active',
    owner_response: null,
  },
  {
    id: 'diff_mango_water',
    property: 'mango-leaf-pg-for-women',
    field_name: 'costs.other_charges',
    title: 'Residents mention a summer water charge that is not in the listing',
    listed_value: 'No charges beyond rent',
    reported_summary: 'Two residents report being asked for an extra ₹300 a month from March to May, when tanker water is bought.',
    supporting_review_ids: ['rev_mango_03', 'rev_mango_06'],
    status: 'active',
    owner_response: null,
  },
  {
    id: 'diff_jasmine_deposit',
    property: 'jasmine-court-working-womens-pg',
    field_name: 'costs.deposit_refund',
    title: 'Residents mention a deduction from the deposit when they moved out',
    listed_value: 'Deposit fully refundable with 30 days’ notice',
    reported_summary: 'Two former residents report that ₹1,500 was deducted as a “painting charge” at check-out, which is not in the listing.',
    supporting_review_ids: ['rev_jasmine_04', 'rev_jasmine_08'],
    status: 'active',
    owner_response: null,
  },
  {
    id: 'diff_jasmine_wifi',
    property: 'jasmine-court-working-womens-pg',
    field_name: 'wifi.speed_mbps',
    title: 'Residents report slow Wi-Fi in the evenings',
    listed_value: '60 Mbps, rooms and common areas',
    reported_summary: 'Two residents report video calls dropping between 8 and 11 PM.',
    supporting_review_ids: ['rev_jasmine_02', 'rev_jasmine_06'],
    status: 'owner_responded',
    owner_response: 'Owner says a second 100 Mbps line was added in September 2026. Not yet checked by Havenly.',
  },
]
