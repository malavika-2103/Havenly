// ~90 fictional sample reviews (data_source demo_seed). Counts per property are deliberately small
// (0–12 approved) because the platform is newly launched in this area.
// Category order: [cleanliness, food_quality, maintenance, management, privacy, value_for_money, security]
// Review text must agree with the property record; validate.ts checks this.

type Cat = number | null
export type ReviewTypeSeed = 'general' | 'tip' | 'expectation_vs_reality' | 'hidden_cost' | 'rule_experience' | 'safety_report'

export interface ReviewSeed {
  id: string
  property: string
  name: string
  overall: number
  cats: [Cat, Cat, Cat, Cat, Cat, Cat, Cat]
  type: ReviewTypeSeed
  title: string
  body: string
  stay: [string, string | null] // [start YYYY-MM, end YYYY-MM or null when currently staying]
  residency: 'approved' | 'unverified' | 'pending'
  moderation?: 'approved' | 'pending' | 'flagged' | 'rejected'
  moderation_note?: string
  report_count?: number
  themes: string[]
  created: string // YYYY-MM-DD
}

const T = 'tulsi-nest-womens-pg'
const K = 'kayal-house-ladies-hostel'
const C = 'coconut-grove-coliving'
const M = 'mango-leaf-pg-for-women'
const H = 'harbour-line-mens-hostel'
const N = 'nila-womens-hostel'
const J = 'jasmine-court-working-womens-pg'
const P = 'palm-shade-mens-hostel'
const L = 'lotus-residency-for-women'
const S = 'kaithari-shared-homes'
const A = 'anjili-womens-hostel'
const G = 'greenline-mens-hostel'
const W = 'sandalwood-suites-womens-pg'
const X = 'ixora-ladies-pg'

export const reviews: ReviewSeed[] = [
  // ---------------- Tulsi Nest (11 approved) ----------------
  {
    id: 'rev_tulsi_01', property: T, name: 'Aparna R.', overall: 5, cats: [5, 5, 4, 5, 4, 4, 5], type: 'general',
    title: 'Easy walk to Infopark, food that tastes like home',
    body: 'I walk to Infopark Phase 1 in about twelve minutes, even in the rain. The fish curry on Wednesdays is the closest thing to my amma’s I have found in Kakkanad. Wi-Fi has held up through every client call in eight months.',
    stay: ['2026-02', null], residency: 'approved', themes: ['commute', 'food', 'wifi'], created: '2026-09-02',
  },
  {
    id: 'rev_tulsi_02', property: T, name: 'Meghna S.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 5], type: 'rule_experience',
    title: 'Late entry works, just tell the warden first',
    body: 'The gate closes at 10:30 PM. On weeks when I am on the late shift I message the warden before 8 and the night guard lets me in on my fingerprint. It has never been a problem, but you do have to tell them in advance.',
    stay: ['2025-11', null], residency: 'approved', themes: ['curfew', 'late_entry'], created: '2026-09-05',
  },
  {
    id: 'rev_tulsi_03', property: T, name: 'Divya K.', overall: 3, cats: [4, 4, 3, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'Hot water is not really 24 hours',
    body: 'The listing says 24-hour hot water. On rainy days the solar heater is used up by about 8 in the morning, and the backup geyser is switched on only when someone asks the warden. In June and July that was a daily irritation. Everything else has been good.',
    stay: ['2025-06', '2026-07'], residency: 'approved', themes: ['hot_water', 'monsoon'], created: '2026-08-11',
  },
  {
    id: 'rev_tulsi_04', property: T, name: 'Fathima N.', overall: 5, cats: [5, 4, 5, 5, 5, 4, 5], type: 'general',
    title: 'The warden chechi is why I stayed',
    body: 'I got dengue in my second month here. The warden chechi brought kanji to my room, sat with me in the auto to the hospital and called my parents. The rooms are clean and the people running it actually care.',
    stay: ['2025-09', null], residency: 'approved', themes: ['management', 'warden'], created: '2026-08-19',
  },
  {
    id: 'rev_tulsi_05', property: T, name: 'Sneha P.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 4], type: 'tip',
    title: 'Ask for a room at the back',
    body: 'Front rooms hear the expressway traffic from 8 AM. Back rooms are quieter and get morning light. KSEB cuts here are short, and the inverter keeps the fans and Wi-Fi running, but not the AC.',
    stay: ['2026-01', null], residency: 'approved', themes: ['noise', 'power_cuts'], created: '2026-09-21',
  },
  {
    id: 'rev_tulsi_06', property: T, name: 'Riya M.', overall: 4, cats: [5, 4, 4, 4, 4, 3, 4], type: 'general',
    title: 'Very clean, a bit pricey',
    body: 'Rooms are cleaned three times a week and bathrooms every day. ₹10,200 for an AC double is on the higher side for Kakkanad, but it includes all meals and electricity, so it evens out.',
    stay: ['2025-12', null], residency: 'unverified', themes: ['cleaning', 'value'], created: '2026-10-01',
  },
  {
    id: 'rev_tulsi_07', property: T, name: 'Anusree V.', overall: 3, cats: [4, 3, 3, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'Monsoon mornings mean cold showers',
    body: 'During the monsoon there is a queue for the one bathroom where the geyser is on. Management is polite and keeps saying the solar heater will be serviced. It was still the same when I left.',
    stay: ['2025-05', '2026-08'], residency: 'approved', themes: ['hot_water', 'maintenance'], created: '2026-08-28',
  },
  {
    id: 'rev_tulsi_08', property: T, name: 'Pooja D.', overall: 5, cats: [5, 4, 5, 5, 4, 4, 5], type: 'general',
    title: 'Felt settled within a week',
    body: 'I came to Kakkanad for my first job and didn’t know anyone. Dinner is at a common table and that is where I made friends. The biometric gate and the night guard meant I never had to worry about coming back from a late team dinner.',
    stay: ['2026-03', null], residency: 'approved', themes: ['community', 'security'], created: '2026-09-14',
  },
  {
    id: 'rev_tulsi_09', property: T, name: 'Lakshmi G.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'tip',
    title: 'Budget for laundry',
    body: 'Laundry is ₹500 a month on top of rent. It is in the listing, so it wasn’t a surprise, but plan for it. Clothes come back in two days, longer in the monsoon.',
    stay: ['2025-10', null], residency: 'approved', themes: ['laundry', 'costs'], created: '2026-09-29',
  },
  {
    id: 'rev_tulsi_10', property: T, name: 'Nimisha J.', overall: 3, cats: [4, 4, 3, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'Geyser only on request',
    body: 'Same as others have said. Hot water in the morning depends on the sun. If it has rained overnight you have to ask for the geyser and then wait twenty minutes. The listing should just say this.',
    stay: ['2025-08', '2026-06'], residency: 'approved', themes: ['hot_water'], created: '2026-08-07',
  },
  {
    id: 'rev_tulsi_11', property: T, name: 'Hiba A.', overall: 5, cats: [5, 5, 4, 5, 4, 4, 5], type: 'general',
    title: 'Sunday biriyani is worth the rent',
    body: 'The food is the best part. Appam and stew on Fridays, biriyani on Sundays, and they make chapati for those of us who want it. Rooms are spotless.',
    stay: ['2026-04', null], residency: 'approved', themes: ['food'], created: '2026-10-06',
  },

  // ---------------- Kayal House (12 approved) ----------------
  {
    id: 'rev_kayal_01', property: K, name: 'Ann Mary T.', overall: 4, cats: [5, 4, 4, 4, 3, 5, 5], type: 'general',
    title: 'Strict, but my parents never worried',
    body: 'There is a guard at the gate all day and night, cameras in every corridor, and the matron knows every girl by name. It is strict, but that is exactly why my parents agreed to let me move here for college.',
    stay: ['2024-07', null], residency: 'approved', themes: ['security', 'rules'], created: '2026-08-15',
  },
  {
    id: 'rev_kayal_02', property: K, name: 'Sruthi B.', overall: 3, cats: [4, 4, 4, 3, 3, 4, 5], type: 'rule_experience',
    title: 'The gate says 9:30, the inner door says 9:15',
    body: 'The listing says the gate closes at 9:30 PM. In practice the inner door is locked at about 9:15 and the matron does the headcount then. If you are coming back from the bus stop at 9:20 you will be questioned.',
    stay: ['2025-06', null], residency: 'approved', themes: ['curfew'], created: '2026-08-22',
  },
  {
    id: 'rev_kayal_03', property: K, name: 'Gayathri S.', overall: 4, cats: [4, 4, 4, 4, 3, 5, 5], type: 'tip',
    title: 'Sort out your local guardian letter early',
    body: 'If you ever want to come back late or stay out overnight you need an out-pass, and for that a letter from a local guardian. Get it done in the first week, not on the day you need it.',
    stay: ['2025-07', null], residency: 'approved', themes: ['out_pass', 'rules'], created: '2026-09-03',
  },
  {
    id: 'rev_kayal_04', property: K, name: 'Nandana P.', overall: 4, cats: [4, 4, 4, 4, 4, 5, 5], type: 'general',
    title: 'Rice and fish curry every day, no complaints',
    body: 'Lunch is matta rice with fish curry or sambar, thoran and pickle. It is simple Kerala food and there is enough of it. Evening tea with pazhampori is my favourite part of the day.',
    stay: ['2025-08', null], residency: 'approved', themes: ['food'], created: '2026-09-10',
  },
  {
    id: 'rev_kayal_05', property: K, name: 'Jyothika R.', overall: 2, cats: [4, 3, 3, 2, 2, 4, 5], type: 'rule_experience',
    title: 'Ten minutes late and it became a big deal',
    body: 'My bus back from an evening class got stuck in traffic and I reached at 9:25. The inner door was already locked and I had to call the matron, then write an explanation the next morning. Know that the real cut-off is earlier than 9:30.',
    stay: ['2025-01', '2026-05'], residency: 'approved', themes: ['curfew', 'management'], created: '2026-08-09',
  },
  {
    id: 'rev_kayal_06', property: K, name: 'Reshma K.', overall: 4, cats: [5, 4, 4, 4, 3, 4, 5], type: 'general',
    title: 'Cleaning really is every day',
    body: 'Rooms are swept and mopped six days a week and the bathrooms twice a day. For a hostel at this price that is rare. Rooms are crowded though, so do not expect much privacy in a triple.',
    stay: ['2025-07', null], residency: 'unverified', themes: ['cleaning', 'privacy'], created: '2026-09-17',
  },
  {
    id: 'rev_kayal_07', property: K, name: 'Ameena S.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 5], type: 'expectation_vs_reality',
    title: 'Wi-Fi only works in the study hall',
    body: 'The Wi-Fi is about 40 Mbps and only reaches the study hall downstairs, not the rooms. It is fine for assignments, but if you need it in your room, budget for a mobile data pack.',
    stay: ['2025-08', null], residency: 'approved', themes: ['wifi'], created: '2026-09-25',
  },
  {
    id: 'rev_kayal_08', property: K, name: 'Keerthana M.', overall: 5, cats: [5, 4, 4, 5, 4, 5, 5], type: 'safety_report',
    title: 'How the walk back felt to me',
    body: 'In my experience, walking from the main road after evening class felt comfortable. The approach road is lit, and the guard at the gate checks everyone who comes in. That was my experience over two semesters. Please visit at night yourself before deciding.',
    stay: ['2025-06', '2026-04'], residency: 'approved', themes: ['safety', 'night_commute'], created: '2026-08-30',
  },
  {
    id: 'rev_kayal_09', property: K, name: 'Tanvi R.', overall: 3, cats: [4, 4, 4, 3, 3, 4, 5], type: 'rule_experience',
    title: 'Late entry needs a note a day ahead',
    body: 'Late entry is possible “with permission”, but permission means a written note from your local guardian handed in the day before. For a one-off late class that is impractical. The rules are stricter than the listing makes them sound.',
    stay: ['2025-11', null], residency: 'approved', themes: ['curfew', 'late_entry'], created: '2026-10-02',
  },
  {
    id: 'rev_kayal_10', property: K, name: 'Athira V.', overall: 4, cats: [4, 4, 4, 5, 3, 4, 5], type: 'general',
    title: 'The matron runs it like a family',
    body: 'Strict, yes, but when I was homesick in the first month the matron made me sit with her in the evenings. All the staff are women, which my mother liked.',
    stay: ['2025-07', null], residency: 'approved', themes: ['management', 'warden'], created: '2026-09-08',
  },
  {
    id: 'rev_kayal_11', property: K, name: 'Swathi N.', overall: 4, cats: [4, 4, 4, 4, 3, 5, 5], type: 'tip',
    title: 'Bring a table fan for April',
    body: 'There is no AC in any room and the top floor gets hot in April and May. A small table fan made a big difference. The inverter keeps ceiling fans running during KSEB cuts.',
    stay: ['2025-03', null], residency: 'approved', themes: ['heat', 'power_cuts'], created: '2026-09-19',
  },
  {
    id: 'rev_kayal_12', property: K, name: 'Neha J.', overall: 3, cats: [4, 4, 3, 3, 3, 4, 4], type: 'expectation_vs_reality',
    title: 'Hot water only early in the morning',
    body: 'Hot water is available from about 6 to 8 AM. If you have a late class and shower at 9 it is cold. The listing does not claim otherwise, but it surprised me.',
    stay: ['2025-12', null], residency: 'unverified', themes: ['hot_water'], created: '2026-10-08',
  },

  // ---------------- Coconut Grove (9 approved) ----------------
  {
    id: 'rev_coconut_01', property: C, name: 'Arjun M.', overall: 5, cats: [5, null, 5, 4, 5, 4, 4], type: 'general',
    title: 'The fastest Wi-Fi I have had in Kakkanad',
    body: 'The 200 Mbps line actually tests at around 180 in the evening, and the backup line kicked in during the one outage I saw. I work US hours and the no-curfew keycard setup suits that perfectly.',
    stay: ['2025-10', null], residency: 'approved', themes: ['wifi', 'freedom'], created: '2026-08-24',
  },
  {
    id: 'rev_coconut_02', property: C, name: 'Shreya N.', overall: 4, cats: [4, null, 4, 4, 5, 3, 4], type: 'general',
    title: 'The women’s floor works well',
    body: 'The fourth floor is women only, and only our keycards open that corridor. It feels like a flat, not a hostel. It is expensive, so I would only recommend it if your salary allows.',
    stay: ['2026-01', null], residency: 'approved', themes: ['privacy', 'value'], created: '2026-09-06',
  },
  {
    id: 'rev_coconut_03', property: C, name: 'Vishnu P.', overall: 4, cats: [4, null, 4, 4, 4, 3, 4], type: 'tip',
    title: 'Electricity is metered, and AC adds up',
    body: 'Electricity is billed on the meter for each room. Mine was around ₹1,100 in April with the AC on at night, and about ₹450 in the monsoon. Budget for it on top of the rent.',
    stay: ['2025-09', null], residency: 'approved', themes: ['electricity', 'costs'], created: '2026-09-12',
  },
  {
    id: 'rev_coconut_04', property: C, name: 'Kavya I.', overall: 5, cats: [5, null, 5, 5, 5, 4, 5], type: 'general',
    title: 'Keycard entry, no curfew, no drama',
    body: 'Coming back at 2 AM after a release night is just a keycard tap. The night guard knows the residents. Maintenance requests through the app get answered the same day.',
    stay: ['2025-07', null], residency: 'approved', themes: ['freedom', 'maintenance'], created: '2026-09-27',
  },
  {
    id: 'rev_coconut_05', property: C, name: 'Rahul T.', overall: 3, cats: [3, null, 4, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'The kitchen gets crowded at 8 PM',
    body: 'There is one kitchen per floor and twelve of us. Between 7:30 and 9 PM you wait for the induction stove. The photos made it look bigger than it is.',
    stay: ['2026-02', null], residency: 'unverified', themes: ['kitchen', 'crowding'], created: '2026-10-04',
  },
  {
    id: 'rev_coconut_06', property: C, name: 'Elsa J.', overall: 4, cats: [4, null, 4, 4, 5, 3, 4], type: 'general',
    title: 'Pricey, but it is a proper flat',
    body: 'An attached bathroom, a real wardrobe and AC that works. It costs more than most PGs nearby, and you also cook your own food, so count that in.',
    stay: ['2025-12', null], residency: 'approved', themes: ['value', 'rooms'], created: '2026-08-17',
  },
  {
    id: 'rev_coconut_07', property: C, name: 'Nikhil S.', overall: 5, cats: [5, null, 4, 5, 4, 4, 4], type: 'general',
    title: 'Ten minutes to SmartCity',
    body: 'An auto to SmartCity takes about ten minutes and costs around ₹60. Generator backup means no power drama during KSEB cuts.',
    stay: ['2025-06', null], residency: 'approved', themes: ['commute', 'power_cuts'], created: '2026-09-30',
  },
  {
    id: 'rev_coconut_08', property: C, name: 'Ann P.', overall: 4, cats: [4, null, 4, 4, 4, 4, 4], type: 'tip',
    title: 'Singles fill up, so ask early',
    body: 'The single rooms are almost always full. Join the waitlist as soon as you know your joining date. I waited about six weeks.',
    stay: ['2026-03', null], residency: 'approved', themes: ['availability'], created: '2026-10-09',
  },
  {
    id: 'rev_coconut_09', property: C, name: 'Sanjay K.', overall: 4, cats: [5, null, 4, 4, 4, 3, 4], type: 'general',
    title: 'Housekeeping twice a week is enough',
    body: 'Rooms are cleaned twice a week and the corridors and kitchen every day. Bed linen is changed weekly. It always feels clean.',
    stay: ['2025-11', null], residency: 'approved', themes: ['cleaning'], created: '2026-08-26',
  },

  // ---------------- Mango Leaf (8 approved) ----------------
  {
    id: 'rev_mango_01', property: M, name: 'Anjali S.', overall: 4, cats: [4, 5, 3, 4, 3, 5, 3], type: 'general',
    title: 'Homely food, small rooms',
    body: 'Aunty makes puttu and kadala curry most mornings, and the food tastes like home. Rooms are small and the triple is tight for three people with suitcases. For the rent, I have no complaints.',
    stay: ['2025-07', null], residency: 'approved', themes: ['food', 'rooms'], created: '2026-08-13',
  },
  {
    id: 'rev_mango_02', property: M, name: 'Devika R.', overall: 3, cats: [4, 4, 3, 3, 3, 4, 3], type: 'rule_experience',
    title: '9 PM means 9 PM',
    body: 'The gate is locked at 9 and there is no late entry at all. If you have evening practicals or plans in town, this is not the place for you.',
    stay: ['2025-06', '2026-04'], residency: 'approved', themes: ['curfew'], created: '2026-08-21',
  },
  {
    id: 'rev_mango_03', property: M, name: 'Shilpa M.', overall: 3, cats: [4, 4, 3, 3, 3, 3, 3], type: 'hidden_cost',
    title: 'Extra ₹300 a month for water in summer',
    body: 'From March to May the well runs low and they buy tanker water. We were each asked to pay ₹300 extra a month for it. It was not mentioned when I joined and is not in the listing.',
    stay: ['2025-07', '2026-06'], residency: 'approved', themes: ['water', 'hidden_cost'], created: '2026-08-04',
  },
  {
    id: 'rev_mango_04', property: M, name: 'Ishita B.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 3], type: 'tip',
    title: 'The 150 GB data cap goes fast',
    body: 'The Wi-Fi has a 150 GB monthly cap shared by everyone. By the 20th it slows to a crawl. Keep a mobile data pack for exam season.',
    stay: ['2025-08', null], residency: 'approved', themes: ['wifi'], created: '2026-09-09',
  },
  {
    id: 'rev_mango_05', property: M, name: 'Gopika T.', overall: 3, cats: [4, 4, 3, 3, 3, 4, 2], type: 'general',
    title: 'There is no CCTV',
    body: 'There is no CCTV at the gate or anywhere else. The owner’s family downstairs is the only security. It felt fine to me, but if cameras matter to you, look elsewhere.',
    stay: ['2025-10', null], residency: 'unverified', themes: ['security'], created: '2026-09-23',
  },
  {
    id: 'rev_mango_06', property: M, name: 'Merin J.', overall: 3, cats: [4, 4, 3, 3, 3, 3, 3], type: 'hidden_cost',
    title: 'The water charge came back in April',
    body: 'Like last year, we were told in April to pay ₹300 each for tanker water. It is not a lot of money, but it should be in the listing so people can plan for it.',
    stay: ['2025-06', null], residency: 'approved', themes: ['water', 'hidden_cost'], created: '2026-09-15',
  },
  {
    id: 'rev_mango_07', property: M, name: 'Sana F.', overall: 4, cats: [4, 4, 4, 4, 3, 5, 3], type: 'general',
    title: 'Cheap and clean enough for first year',
    body: 'For ₹5,500 with three meals, this is hard to beat near the campuses. Rooms are cleaned twice a week, so keep your own space tidy in between.',
    stay: ['2025-07', null], residency: 'approved', themes: ['value'], created: '2026-10-03',
  },
  {
    id: 'rev_mango_08', property: M, name: 'Haritha K.', overall: 3, cats: [3, 4, 3, 3, 3, 4, 3], type: 'general',
    title: 'Power cuts and a small inverter',
    body: 'The inverter runs only the lights and fans. During the long KSEB cuts in May the Wi-Fi router went off too. Charge your laptop when you can.',
    stay: ['2025-09', null], residency: 'approved', themes: ['power_cuts'], created: '2026-08-29',
  },

  // ---------------- Harbour Line (6 approved) ----------------
  {
    id: 'rev_harbour_01', property: H, name: 'Abhijith K.', overall: 4, cats: [4, 3, 4, 4, 4, 4, 4], type: 'general',
    title: 'Walk to Infopark, and the mess is optional',
    body: 'The back gate of Phase 1 is a seven-minute walk. I skip the mess on weekdays because the office cafeteria is cheaper, and the hostel lets you opt out each month.',
    stay: ['2025-08', null], residency: 'approved', themes: ['commute', 'food'], created: '2026-08-18',
  },
  {
    id: 'rev_harbour_02', property: H, name: 'Mohammed F.', overall: 3, cats: [3, 3, 3, 3, 4, 3, 4], type: 'general',
    title: 'Mess food gets repetitive',
    body: 'Chapati and dal four nights a week. The Kerala lunch is better than the North Indian dinner. The late dinner window until 11 PM is useful for shift people.',
    stay: ['2026-01', null], residency: 'approved', themes: ['food'], created: '2026-09-04',
  },
  {
    id: 'rev_harbour_03', property: H, name: 'Karthik R.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 4], type: 'tip',
    title: 'Take the AC double and split the meter',
    body: 'Electricity is metered per room. In the AC double it came to about ₹500 each a month. That is cheaper than the non-AC single, and you sleep much better in April.',
    stay: ['2025-10', null], residency: 'approved', themes: ['electricity', 'costs'], created: '2026-09-20',
  },
  {
    id: 'rev_harbour_04', property: H, name: 'Ajay V.', overall: 3, cats: [3, 3, 3, 3, 4, 4, 3], type: 'expectation_vs_reality',
    title: 'The night guard is mostly asleep',
    body: 'There is a night guard as listed, but after about 1 AM he is usually asleep in his chair. There is a camera at the entrance. I would not leave anything valuable in the corridor.',
    stay: ['2025-05', '2026-06'], residency: 'unverified', themes: ['security'], created: '2026-08-08',
  },
  {
    id: 'rev_harbour_05', property: H, name: 'Rohit S.', overall: 4, cats: [4, 3, 4, 4, 4, 4, 4], type: 'general',
    title: 'Covered bike parking is a big plus',
    body: 'My bike stays dry through the monsoon. That is rare around Infopark Road. The rooms are plain but well kept.',
    stay: ['2025-12', null], residency: 'approved', themes: ['parking'], created: '2026-09-28',
  },
  {
    id: 'rev_harbour_06', property: H, name: 'Sebin G.', overall: 4, cats: [4, 3, 4, 4, 4, 4, 4], type: 'general',
    title: 'Good for shift work, no curfew',
    body: 'I come in at 3 AM twice a week and nobody asks questions. The Wi-Fi is steady enough for remote standups from my room.',
    stay: ['2026-02', null], residency: 'approved', themes: ['freedom', 'wifi'], created: '2026-10-07',
  },

  // ---------------- Nila (5 approved) ----------------
  {
    id: 'rev_nila_01', property: N, name: 'Arya S.', overall: 4, cats: [3, 4, 3, 4, 2, 5, 3], type: 'general',
    title: 'Cheapest option near Bharata Mata College',
    body: 'Four and a half thousand with food is what my family could afford. The dorm is crowded and noisy, but the food is decent and the college is a short walk.',
    stay: ['2025-06', null], residency: 'approved', themes: ['value', 'commute'], created: '2026-08-16',
  },
  {
    id: 'rev_nila_02', property: N, name: 'Fida M.', overall: 3, cats: [3, 3, 3, 3, 2, 4, 3], type: 'rule_experience',
    title: 'An 8:30 PM curfew is early',
    body: 'The gate closes at 8:30 and there is no late entry. Evening library hours at college are basically off limits. Fine for first years, hard for anyone with internships.',
    stay: ['2025-07', null], residency: 'approved', themes: ['curfew'], created: '2026-09-01',
  },
  {
    id: 'rev_nila_03', property: N, name: 'Varsha P.', overall: 3, cats: [3, 3, 3, 4, 2, 4, 2], type: 'safety_report',
    title: 'The lane from the main road felt dark to me',
    body: 'In my experience the lane from the main road, around 450 m, has two stretches without streetlights. After 7 PM I always took an auto right to the gate. When I mentioned it, the matron asked the panchayat about lights. Others may feel differently.',
    stay: ['2025-06', '2026-05'], residency: 'approved', themes: ['safety', 'night_commute'], created: '2026-08-25',
  },
  {
    id: 'rev_nila_04', property: N, name: 'Christy A.', overall: 4, cats: [3, 4, 3, 5, 2, 4, 3], type: 'general',
    title: 'The matron is kind',
    body: 'The matron lives on site and treats us like her own kids. When the water pump broke during the monsoon she arranged buckets from the neighbours that same night.',
    stay: ['2025-08', null], residency: 'unverified', themes: ['warden', 'water'], created: '2026-09-18',
  },
  {
    id: 'rev_nila_05', property: N, name: 'Niranjana V.', overall: 2, cats: [3, 3, 2, 2, 2, 3, 3], type: 'expectation_vs_reality',
    title: 'Wi-Fi is paid and slow',
    body: 'Wi-Fi costs ₹300 extra a month and only works in the common hall. At 25 Mbps shared by everyone, online classes kept buffering. I ended up on mobile data.',
    stay: ['2025-09', '2026-07'], residency: 'approved', themes: ['wifi', 'costs'], created: '2026-08-12',
  },

  // ---------------- Jasmine Court (9 approved) ----------------
  {
    id: 'rev_jasmine_01', property: J, name: 'Nayana K.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'general',
    title: 'Five minutes to Infopark Phase 1',
    body: 'An auto to Phase 1 takes five minutes, or a fifteen-minute walk on dry days. The rooms are airy and cleaned three times a week.',
    stay: ['2025-09', null], residency: 'approved', themes: ['commute', 'cleaning'], created: '2026-08-20',
  },
  {
    id: 'rev_jasmine_02', property: J, name: 'Bhavana R.', overall: 3, cats: [4, 4, 3, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'Wi-Fi struggles after 8 PM',
    body: 'Mornings are fine, but between 8 and 11 PM my video calls kept dropping. With everyone home and streaming, the 60 Mbps line is not enough. I bought a dongle for evening calls.',
    stay: ['2025-11', null], residency: 'approved', themes: ['wifi'], created: '2026-08-27',
  },
  {
    id: 'rev_jasmine_03', property: J, name: 'Rincy T.', overall: 4, cats: [4, 4, 4, 5, 4, 4, 4], type: 'general',
    title: 'An approachable lady warden',
    body: 'The lady warden lives on the ground floor and sorts out problems quickly. When our fan stopped working it was fixed the next morning.',
    stay: ['2025-08', null], residency: 'approved', themes: ['warden', 'maintenance'], created: '2026-09-07',
  },
  {
    id: 'rev_jasmine_04', property: J, name: 'Akhila S.', overall: 2, cats: [4, 3, 3, 2, 4, 2, 4], type: 'hidden_cost',
    title: '₹1,500 taken from my deposit for painting',
    body: 'When I moved out, ₹1,500 was deducted from my deposit as a “painting charge”. The listing says the deposit is fully refundable and nobody mentioned this when I joined. Ask for it in writing before you pay.',
    stay: ['2024-10', '2026-03'], residency: 'approved', themes: ['deposit', 'hidden_cost'], created: '2026-08-06',
  },
  {
    id: 'rev_jasmine_05', property: J, name: 'Theertha M.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'tip',
    title: 'Take the mess, because you cannot cook',
    body: 'Cooking in the room is not allowed, not even an electric kettle. The optional mess is ₹3,500 and includes a packed lunch, which is easier than finding food near Infopark every day.',
    stay: ['2026-01', null], residency: 'approved', themes: ['food', 'rules'], created: '2026-09-16',
  },
  {
    id: 'rev_jasmine_06', property: J, name: 'Ann Rose P.', overall: 3, cats: [4, 4, 3, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'Evening Wi-Fi was the only real problem',
    body: 'Same issue as others. After 8 PM the Wi-Fi slows down badly. The owner said a second line was coming. I left before I could see if it helped.',
    stay: ['2025-07', '2026-08'], residency: 'approved', themes: ['wifi'], created: '2026-09-02',
  },
  {
    id: 'rev_jasmine_07', property: J, name: 'Pavithra L.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'safety_report',
    title: 'One evening at the gate',
    body: 'One evening a man I didn’t know was waiting near the gate. I told the lady warden, she called the night guard, and he left. Nothing happened, and it was the only time in a year. Since then I take an auto to the gate after dark. This is just my experience.',
    stay: ['2025-06', null], residency: 'approved', themes: ['safety'], created: '2026-09-24',
  },
  {
    id: 'rev_jasmine_08', property: J, name: 'Sreelakshmi D.', overall: 3, cats: [4, 4, 3, 2, 4, 3, 4], type: 'hidden_cost',
    title: 'Deposit deduction nobody mentioned',
    body: 'I lost ₹1,500 of my deposit to a “painting charge” at exit, the same as my roommate. It is not in the listing or the receipt. Everything else about the stay was fine.',
    stay: ['2025-03', '2026-07'], residency: 'approved', themes: ['deposit', 'hidden_cost'], created: '2026-08-14',
  },
  {
    id: 'rev_jasmine_09', property: J, name: 'Mehak A.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'rule_experience',
    title: 'Flexible late entry for shift weeks',
    body: 'The gate closes at 11 PM. On my late-shift weeks I message the warden and she leaves the side door with the night guard. Easy, as long as you tell her before dinner.',
    stay: ['2026-02', null], residency: 'unverified', themes: ['curfew', 'late_entry'], created: '2026-10-05',
  },

  // ---------------- Palm Shade (5 approved) ----------------
  {
    id: 'rev_palm_01', property: P, name: 'Aswin R.', overall: 3, cats: [3, 4, 3, 3, 3, 5, 3], type: 'general',
    title: 'Cheap and basic',
    body: 'Four thousand eight hundred with food. Do not expect more than a bed, a cupboard and a fan. The chicken curry on Wednesdays is the highlight of the week.',
    stay: ['2025-07', null], residency: 'approved', themes: ['value', 'food'], created: '2026-08-23',
  },
  {
    id: 'rev_palm_02', property: P, name: 'Faisal K.', overall: 3, cats: [2, 4, 3, 3, 3, 4, 3], type: 'general',
    title: 'Garbage piles up between pickups',
    body: 'Garbage goes out only twice a week. By the third day the bins near the stairs smell, especially in the monsoon. Rooms are cleaned once a week, so you clean your own space.',
    stay: ['2025-08', null], residency: 'approved', themes: ['garbage', 'cleaning'], created: '2026-09-11',
  },
  {
    id: 'rev_palm_03', property: P, name: 'Jithin M.', overall: 4, cats: [3, 4, 3, 4, 3, 5, 3], type: 'tip',
    title: 'Share an auto to MEC',
    body: 'Four of us share an auto to Model Engineering College every morning, which comes to about ₹20 each. Buses on the Seaport–Airport Road are frequent but packed at 8:30.',
    stay: ['2025-07', null], residency: 'approved', themes: ['commute'], created: '2026-09-26',
  },
  {
    id: 'rev_palm_04', property: P, name: 'Deepak N.', overall: 3, cats: [3, 4, 3, 3, 3, 4, 2], type: 'safety_report',
    title: 'My helmet went missing from the bike area',
    body: 'In my experience the parking area is open and there is no camera covering it. My helmet went missing once. I now keep valuables in my room and lock my bike. Others might not have had this problem.',
    stay: ['2025-09', null], residency: 'approved', themes: ['security', 'parking'], created: '2026-10-01',
  },
  {
    id: 'rev_palm_05', property: P, name: 'Albin J.', overall: 3, cats: [3, 4, 3, 3, 3, 4, 3], type: 'expectation_vs_reality',
    title: '20 Mbps does not go far',
    body: 'The Wi-Fi is free but only 20 Mbps for the whole building. It is fine for messaging, but useless for online exams in the evening. Keep a data pack.',
    stay: ['2026-01', null], residency: 'unverified', themes: ['wifi'], created: '2026-10-10',
  },

  // ---------------- Lotus Residency (4 approved) ----------------
  {
    id: 'rev_lotus_01', property: L, name: 'Revathy S.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'general',
    title: 'Full for a reason',
    body: 'Clean AC rooms, decent food and a quiet lane behind the Civil Station. People rarely leave, which is why it is always full. I got in from the waitlist after a friend moved out.',
    stay: ['2025-10', null], residency: 'approved', themes: ['availability', 'rooms'], created: '2026-08-31',
  },
  {
    id: 'rev_lotus_02', property: L, name: 'Anitha G.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'general',
    title: 'Close to the Civil Station and the SEZ',
    body: 'I walk to the Collectorate in five minutes. The street is quiet at night and well lit. The biometric door means no fumbling for keys.',
    stay: ['2025-07', null], residency: 'approved', themes: ['commute', 'security'], created: '2026-09-13',
  },
  {
    id: 'rev_lotus_03', property: L, name: 'Zainab H.', overall: 5, cats: [5, 5, 4, 5, 4, 4, 4], type: 'general',
    title: 'The food and the AC are both good',
    body: 'Chapati at dinner and fish fry on Saturdays. The AC is serviced before every summer, and electricity is included, so there are no surprise bills.',
    stay: ['2026-01', null], residency: 'approved', themes: ['food', 'electricity'], created: '2026-09-22',
  },
  {
    id: 'rev_lotus_04', property: L, name: 'Kriti S.', overall: 3, cats: [4, 4, 3, 3, 4, 3, 4], type: 'rule_experience',
    title: 'Say before 9 if you will be late',
    body: 'The gate closes at 10:30 PM. Late entry is allowed if you tell the manager before 9. Once I forgot and had to wait outside for ten minutes while they found the key.',
    stay: ['2025-12', null], residency: 'unverified', themes: ['curfew'], created: '2026-10-07',
  },

  // ---------------- Kaithari (3 approved) ----------------
  {
    id: 'rev_kaithari_01', property: S, name: 'Neethu P.', overall: 4, cats: [3, null, 4, 4, 5, 4, 3], type: 'general',
    title: 'Like living in a flat with friends',
    body: 'Three of us share a flat with a proper kitchen and a balcony. There is no warden and no rules beyond what we agree on, which is what I wanted after two years in a hostel.',
    stay: ['2025-11', null], residency: 'approved', themes: ['freedom', 'privacy'], created: '2026-09-03',
  },
  {
    id: 'rev_kaithari_02', property: S, name: 'Roshni A.', overall: 4, cats: [3, null, 4, 4, 5, 4, 3], type: 'tip',
    title: 'Split the electricity bill in an app',
    body: 'Electricity is billed on the flat’s meter. We split it in a shared expense app, which saves arguments. It is about ₹600 each in summer.',
    stay: ['2026-01', null], residency: 'approved', themes: ['electricity', 'costs'], created: '2026-09-21',
  },
  {
    id: 'rev_kaithari_03', property: S, name: 'Aiswarya L.', overall: 3, cats: [2, null, 3, 3, 5, 4, 3], type: 'expectation_vs_reality',
    title: 'Weekly cleaning means you clean the rest',
    body: 'Housekeeping comes once a week. Dishes, the kitchen counter and bathrooms the rest of the week are on us. That is fair for a flat, but the listing photos look like a serviced apartment.',
    stay: ['2025-12', null], residency: 'unverified', themes: ['cleaning'], created: '2026-10-06',
  },

  // ---------------- Anjili (2 approved: below the "enough reviews" threshold) ----------------
  {
    id: 'rev_anjili_01', property: A, name: 'Sowmya R.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 3], type: 'general',
    title: 'No curfew, but you sign a register',
    body: 'There is no curfew. If you come back after 10 PM you sign the register at the gate, and that is it. The fish curry is good.',
    stay: ['2025-09', null], residency: 'approved', themes: ['freedom', 'food'], created: '2026-09-19',
  },
  {
    id: 'rev_anjili_02', property: A, name: 'Farhana T.', overall: 3, cats: [3, 4, 3, 3, 3, 3, 3], type: 'general',
    title: 'Fine, but Wi-Fi costs extra',
    body: 'The Wi-Fi is an extra ₹250 a month. The rooms are plain and the triple is crowded. It is OK for the price.',
    stay: ['2026-02', null], residency: 'unverified', themes: ['wifi', 'costs'], created: '2026-10-09',
  },

  // ---------------- Sandalwood Suites (6 approved) ----------------
  {
    id: 'rev_sandalwood_01', property: W, name: 'Swetha R.', overall: 5, cats: [5, 4, 5, 4, 5, 4, 5], type: 'general',
    title: 'Daily housekeeping that really is daily',
    body: 'My room is cleaned every day and the linen is changed every week. The AC rooms with attached bathrooms feel like a service apartment.',
    stay: ['2025-10', null], residency: 'approved', themes: ['cleaning', 'rooms'], created: '2026-08-29',
  },
  {
    id: 'rev_sandalwood_02', property: W, name: 'Aishwarya N.', overall: 4, cats: [5, 4, 4, 4, 4, 4, 5], type: 'safety_report',
    title: 'Coming back from late shifts felt routine to me',
    body: 'In my experience, coming back from a 1 AM Infopark shift felt routine here. The guard at the gate was always awake, the entry is biometric, and the corridors are covered by cameras. That was my experience, not a promise. Visit at night if you can.',
    stay: ['2025-08', null], residency: 'approved', themes: ['safety', 'night_commute'], created: '2026-09-10',
  },
  {
    id: 'rev_sandalwood_03', property: W, name: 'Ritika J.', overall: 4, cats: [5, 4, 4, 4, 4, 3, 4], type: 'general',
    title: 'Pricey, but the food is good',
    body: 'At ₹18,500 for a single it is the most expensive PG I looked at. The food makes up for some of it: dosa mornings, Kerala lunch, roti dinners and evening snacks.',
    stay: ['2026-02', null], residency: 'approved', themes: ['food', 'value'], created: '2026-09-25',
  },
  {
    id: 'rev_sandalwood_04', property: W, name: 'Liya M.', overall: 4, cats: [5, 4, 4, 4, 4, 4, 4], type: 'tip',
    title: 'Ask for a lower floor, the lift is slow',
    body: 'There is one lift for five floors, and at 9 AM everyone is waiting for it. I moved to the second floor and take the stairs.',
    stay: ['2025-12', null], residency: 'approved', themes: ['lift', 'rooms'], created: '2026-10-02',
  },
  {
    id: 'rev_sandalwood_05', property: W, name: 'Hannah C.', overall: 3, cats: [5, 4, 4, 3, 4, 3, 4], type: 'expectation_vs_reality',
    title: 'No warden at night',
    body: 'There is no resident warden. The manager is here during the day, and at night there is only the guard. When I was unwell at midnight there was nobody to ask for help apart from other residents.',
    stay: ['2025-09', '2026-06'], residency: 'unverified', themes: ['management'], created: '2026-08-10',
  },
  {
    id: 'rev_sandalwood_06', property: W, name: 'Uma S.', overall: 5, cats: [5, 4, 5, 5, 5, 4, 5], type: 'general',
    title: 'Worth it if you can afford it',
    body: 'Generator backup, fast Wi-Fi with a second line, and everything is maintained on time. I have recommended it to two colleagues.',
    stay: ['2025-07', null], residency: 'approved', themes: ['maintenance', 'wifi'], created: '2026-09-17',
  },

  // ---------------- Ixora (5 approved) ----------------
  {
    id: 'rev_ixora_01', property: X, name: 'Aadhya K.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 3], type: 'general',
    title: 'Vegetarian food that doesn’t get boring',
    body: 'Pure veg, but the cook rotates avial, olan, sambar and kootu so it doesn’t get repetitive. Payasam on Sundays.',
    stay: ['2025-07', null], residency: 'approved', themes: ['food'], created: '2026-08-24',
  },
  {
    id: 'rev_ixora_02', property: X, name: 'Navya S.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 4], type: 'rule_experience',
    title: 'The gate is at 10 PM, but the warden is reasonable',
    body: 'The gate closes at 10. For lab nights I tell the warden in the afternoon and she waits up. She just asks you not to make it a habit.',
    stay: ['2025-08', null], residency: 'approved', themes: ['curfew', 'warden'], created: '2026-09-06',
  },
  {
    id: 'rev_ixora_03', property: X, name: 'Shalini R.', overall: 3, cats: [4, 4, 3, 3, 2, 4, 3], type: 'general',
    title: 'Small rooms',
    body: 'The triple room barely fits three beds and three cupboards. Clean and safe enough, but cramped once everyone’s books come out before exams.',
    stay: ['2025-11', null], residency: 'unverified', themes: ['rooms', 'privacy'], created: '2026-09-29',
  },
  {
    id: 'rev_ixora_04', property: X, name: 'Krishnapriya M.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 3], type: 'tip',
    title: 'You can walk to MEC',
    body: 'It is about a twelve-minute walk to Model Engineering College through the temple road. In the monsoon the road floods near the canal for a few days, so keep auto money handy.',
    stay: ['2025-07', null], residency: 'approved', themes: ['commute', 'monsoon'], created: '2026-10-04',
  },
  {
    id: 'rev_ixora_05', property: X, name: 'Bincy T.', overall: 4, cats: [4, 4, 4, 4, 3, 4, 3], type: 'general',
    title: 'Good first-year PG',
    body: 'A warden on site, food included, and the rent is within a student budget. The Wi-Fi is OK for classes.',
    stay: ['2026-01', null], residency: 'approved', themes: ['value'], created: '2026-10-11',
  },

  // ---------------- Moderation queue (not public) ----------------
  {
    id: 'rev_queue_01', property: T, name: 'Gauri N.', overall: 4, cats: [4, 4, 4, 4, 4, 4, 4], type: 'general',
    title: 'Good so far, two weeks in',
    body: 'Two weeks in. The food is good and the room is clean. Will update after a few months.',
    stay: ['2026-10', null], residency: 'pending', moderation: 'pending', themes: ['food'], created: '2026-10-13',
  },
  {
    id: 'rev_queue_02', property: H, name: 'Best Hostel', overall: 5, cats: [5, 5, 5, 5, 5, 5, 5], type: 'general',
    title: 'BEST HOSTEL EVER 5 STARS!!!',
    body: 'Best hostel in Kakkanad!!! Everything perfect, very good food, very good rooms, best owner. Must book now!!!',
    stay: ['2026-09', null], residency: 'unverified', moderation: 'flagged', report_count: 4,
    moderation_note: 'Auto-flagged: promotional language, three similar five-star reviews in 24 hours.',
    themes: [], created: '2026-10-12',
  },
  {
    id: 'rev_queue_03', property: K, name: 'Anonymous', overall: 1, cats: [null, null, null, 1, null, null, null], type: 'general',
    title: 'Complaint about a staff member',
    body: 'Names a staff member and makes an accusation that could not be verified.',
    stay: ['2025-01', '2025-06'], residency: 'unverified', moderation: 'rejected',
    moderation_note: 'Rejected: names an individual and makes an unverified allegation. The reviewer was invited to resubmit about their own experience.',
    themes: [], created: '2026-09-30',
  },
  {
    id: 'rev_queue_04', property: C, name: 'Tejas B.', overall: 3, cats: [3, null, 3, 3, 4, 3, 3], type: 'tip',
    title: 'Ask about the parking slot before moving in',
    body: 'Car parking is limited. Ask whether a slot is free before you move in.',
    stay: ['2026-06', null], residency: 'unverified', moderation: 'pending', themes: ['parking'], created: '2026-10-14',
  },
  {
    id: 'rev_queue_05', property: G, name: 'Manu P.', overall: 4, cats: [4, 3, 4, 4, 4, 4, 3], type: 'general',
    title: 'New building, clean rooms',
    body: 'The building is new, the rooms are clean and the AC double is good value. The mess is average.',
    stay: ['2026-07', null], residency: 'pending', moderation: 'pending', themes: ['rooms'], created: '2026-10-11',
  },
  {
    id: 'rev_queue_06', property: P, name: 'Owner Friend', overall: 5, cats: [5, 5, 5, 5, 5, 5, 5], type: 'general',
    title: 'Very nice place',
    body: 'Very nice place, owner is very good person. Recommended for all students.',
    stay: ['2026-08', null], residency: 'unverified', moderation: 'flagged', report_count: 2,
    moderation_note: 'Flagged: submitted from the same device as the listing owner.',
    themes: [], created: '2026-10-08',
  },
  {
    id: 'rev_queue_07', property: L, name: 'Promo', overall: 5, cats: [null, null, null, null, null, null, null], type: 'general',
    title: 'Cheap flights and hotel deals',
    body: 'Off-topic advertisement.',
    stay: ['2026-01', null], residency: 'unverified', moderation: 'rejected', moderation_note: 'Rejected: spam.',
    themes: [], created: '2026-09-27',
  },
]
