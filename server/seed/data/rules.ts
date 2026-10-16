// House rules as listed. Curfew mix: 3 fixed, 4 flexible, 9 none.
export interface RulesSeed {
  gate_close_time: string | null
  curfew_type: 'none' | 'flexible' | 'fixed'
  late_entry_policy: 'none' | 'with_permission' | 'flexible'
  out_pass_required: boolean
  visitors_policy: 'not_allowed' | 'reception_only' | 'daytime_only' | 'with_notice'
  visitor_hours: string | null
  smoking_alcohol_policy: string
  overnight_guests: boolean
}

const NO_SMOKE = 'Not allowed anywhere on the premises'

export const rules: Record<string, RulesSeed> = {
  'tulsi-nest-womens-pg': { gate_close_time: '22:30', curfew_type: 'flexible', late_entry_policy: 'with_permission', out_pass_required: false, visitors_policy: 'reception_only', visitor_hours: '10 AM – 7 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'kayal-house-ladies-hostel': { gate_close_time: '21:30', curfew_type: 'fixed', late_entry_policy: 'with_permission', out_pass_required: true, visitors_policy: 'reception_only', visitor_hours: '10 AM – 6 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'coconut-grove-coliving': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'with_notice', visitor_hours: '8 AM – 10 PM', smoking_alcohol_policy: 'Smoking on the terrace only. No alcohol in common areas', overnight_guests: false },
  'mango-leaf-pg-for-women': { gate_close_time: '21:00', curfew_type: 'fixed', late_entry_policy: 'none', out_pass_required: true, visitors_policy: 'daytime_only', visitor_hours: '10 AM – 5 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'harbour-line-mens-hostel': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'reception_only', visitor_hours: '9 AM – 9 PM', smoking_alcohol_policy: 'Smoking in the designated area outside. No alcohol', overnight_guests: false },
  'nila-womens-hostel': { gate_close_time: '20:30', curfew_type: 'fixed', late_entry_policy: 'none', out_pass_required: true, visitors_policy: 'reception_only', visitor_hours: '10 AM – 5 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'jasmine-court-working-womens-pg': { gate_close_time: '23:00', curfew_type: 'flexible', late_entry_policy: 'with_permission', out_pass_required: false, visitors_policy: 'daytime_only', visitor_hours: '10 AM – 6 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'palm-shade-mens-hostel': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'daytime_only', visitor_hours: '9 AM – 8 PM', smoking_alcohol_policy: 'No smoking inside rooms. No alcohol', overnight_guests: false },
  'lotus-residency-for-women': { gate_close_time: '22:30', curfew_type: 'flexible', late_entry_policy: 'with_permission', out_pass_required: false, visitors_policy: 'daytime_only', visitor_hours: '10 AM – 7 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'kaithari-shared-homes': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'with_notice', visitor_hours: 'Any time with flatmates’ agreement', smoking_alcohol_policy: 'Decided by flatmates. No smoking indoors', overnight_guests: true },
  'anjili-womens-hostel': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'reception_only', visitor_hours: '10 AM – 7 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'greenline-mens-hostel': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'reception_only', visitor_hours: '9 AM – 9 PM', smoking_alcohol_policy: 'Smoking outside the gate only. No alcohol', overnight_guests: false },
  'sandalwood-suites-womens-pg': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'with_notice', visitor_hours: '9 AM – 9 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'thenmala-shared-house': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'with_notice', visitor_hours: 'Any time with housemates’ agreement', smoking_alcohol_policy: 'No smoking indoors', overnight_guests: true },
  'ixora-ladies-pg': { gate_close_time: '22:00', curfew_type: 'flexible', late_entry_policy: 'with_permission', out_pass_required: false, visitors_policy: 'daytime_only', visitor_hours: '10 AM – 6 PM', smoking_alcohol_policy: NO_SMOKE, overnight_guests: false },
  'rosewood-shared-flats': { gate_close_time: null, curfew_type: 'none', late_entry_policy: 'flexible', out_pass_required: false, visitors_policy: 'with_notice', visitor_hours: 'Any time with flatmates’ agreement', smoking_alcohol_policy: 'No smoking indoors', overnight_guests: true },
}
