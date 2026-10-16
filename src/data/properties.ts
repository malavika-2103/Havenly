export type PropertyType = 'PG' | 'Hostel' | 'Shared Rental'

export interface Review {
 author: string
 initials: string
 stay: string
 month: string
 rating: number
 title: string
 body: string
 tags: string[]
 helpful: number
 categories?: Partial<Categories>
}

export interface Categories {
 cleanliness: number
 food: number
 maintenance: number
 management: number
 privacy: number
 value: number
 security: number
}

export interface Property {
 id: string
 name: string
 type: PropertyType
 locality: string
 city: string
 landmark: string
 distance: string
 gender: string
 rent: number
 deposit: number
 food: 'Included' | 'Optional' | 'Not included'
 foodType: string
 roomTypes: string[]
 ac: boolean
 rating: number
 reviewCount: number
 verified: boolean
 verifiedOn?: string
 listedOn?: string
 art: 'building' | 'room' | 'window' | 'lobby' | 'kitchen' | 'terrace'
 categories: Categories
 wifi: 'Excellent' | 'Good' | 'Average'
 wifiSpeed: string
 curfew: 'No curfew' | 'Flexible' | 'Fixed'
 curfewTime?: string
 garbage: 'Daily' | 'Alternate days' | 'Weekly'
 cleaning: string
 mess: string
 powerBackup: boolean
 security: string
 amenities: { label: string; icon: string; has: boolean }[]
 rules: { label: string; value: string; icon: string }[]
 costs: { label: string; amount: number | string; note?: string }[]
 highlights: string[]
 concerns: { title: string; detail: string }[]
 about: string
 availability: string
 landmarks: { label: string; dist: string }[]
 reviews: Review[]
}

const rev = (
 author: string,
 initials: string,
 stay: string,
 month: string,
 rating: number,
 title: string,
 body: string,
 tags: string[],
 helpful: number,
): Review => ({ author, initials, stay, month, rating, title, body, tags, helpful })

export const CATEGORY_LABELS: Record<keyof Categories, string> = {
 cleanliness: 'Cleanliness',
 food: 'Food quality',
 maintenance: 'Maintenance',
 management: 'Management',
 privacy: 'Privacy',
 value: 'Value for money',
 security: 'Security',
}

export const properties: Property[] = [
 {
 id: 'willow-house',
 name: 'Willow House Women’s PG',
 type: 'PG',
 locality: 'Chittethukara',
 city: 'Kakkanad',
 landmark: ' near Rajagiri campus',
 distance: '650 m from Rajagiri',
 gender: 'Women only',
 rent: 13500,
 deposit: 30000,
 food: 'Included',
 foodType: 'Veg & non-veg, 3 meals + evening snacks',
 roomTypes: ['Single sharing', 'Double sharing', 'Triple sharing'],
 ac: true,
 rating: 4.6,
 reviewCount: 87,
 verified: true,
 verifiedOn: 'Sep 2026',
 art: 'building',
 categories: { cleanliness: 4.8, food: 4.2, maintenance: 4.4, management: 4.7, privacy: 4.9, value: 4.5, security: 4.8 },
 wifi: 'Excellent',
 wifiSpeed: '100 Mbps fibre, backup router on every floor',
 curfew: 'Flexible',
 curfewTime: 'Guests out by 10:30 PM, warden on call after',
 garbage: 'Daily',
 cleaning: 'Daily housekeeping',
 mess: 'In-house cook, menu rotates weekly, extra plates on request',
 powerBackup: true,
 security: 'CCTV on stairs & entrance, biometric door lock, 24×7 warden',
 amenities: [
 { label: 'High-speed WiFi', icon: 'wifi', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'AC rooms', icon: 'ac', has: true },
 { label: 'Laundry (paid)', icon: 'laundry', has: true },
 { label: 'Attached bathroom', icon: 'bath', has: true },
 { label: 'Study space', icon: 'study', has: true },
 { label: 'RO drinking water', icon: 'water', has: true },
 { label: 'Parking', icon: 'parking', has: true },
 { label: 'Lift', icon: 'lift', has: false },
 { label: 'Gym', icon: 'gym', has: false },
 ],
 rules: [
 { label: 'Curfew', value: 'Flexible — gate open till 11:30 PM, sign-in after 10:30 PM', icon: 'moon' },
 { label: 'Visitors', value: 'Female visitors allowed in the ground-floor lounge with prior intimation', icon: 'users' },
 { label: 'Food timings', value: 'Breakfast 7:30–10 AM · Lunch 12:30–2:30 PM · Dinner 7:30–9:30 PM', icon: 'utensils' },
 { label: 'Notice period', value: '30 days, deposit refunded within 7 working days', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (double sharing, with food)', amount: 13500 },
 { label: 'Electricity', amount: 'Actuals, metered separately', note: '₹800–1,400 typical' },
 { label: 'Laundry', amount: '₹600 / month (optional)', note: 'or ₹40 per pick-up' },
 { label: 'Deposit (refundable)', amount: 30000 },
 ],
 highlights: [
 'Reported by 12 residents: WiFi stays stable through the evening — good for online classes and work-from-home',
 'Warden widely described as “respectful of privacy” and easy to talk to',
 'Housekeeping described as thorough; bathrooms cleaned twice a day',
 ],
 concerns: [
 {
 title: 'Advertised “24×7 hot water” differs from resident reports',
 detail:
 'The listing mentions round-the-clock solar hot water. 7 residents reported hot water is available only from 6–10 AM and 6–10 PM in winter months. Havenly has asked the owner to update the listing; status: awaiting response.',
 },
 {
 title: 'Mess closes earlier than advertised',
 detail:
 'Dinner service is advertised till 10 PM, but residents report the mess shuts by 9:30 PM on most days. Reported by 5 verified residents since June 2026.',
 },
 ],
 about:
 'Willow House is a 22-room women-only PG in a quiet residential lane of Chittethukara run by a live-in warden. Rooms are furnished with bed, wardrobe, study table and mattress. The ground floor has a shared lounge with a small library, and the terrace is open for residents until 9 PM. It is popular with students from Rajagiri and Bharata Mata College, and with young professionals working in the Chittethukara tech corridor.',
 availability: '4 rooms free for Nov 2026',
 landmarks: [
 { label: 'Rajagiri campus', dist: '650 m' },
 { label: 'Kakkanad Junction', dist: '1.2 km' },
 { label: 'Chittethukara water tank', dist: '900 m' },
 { label: 'Nearest bus stop (Civil Station)', dist: '3.4 km' },
 ],
 reviews: [
 rev(
 'Ananya S.',
 'AS',
 'Lived here 8 months',
 'Sep 2026',
 5,
 'The safest I’ve felt in a PG',
 'I moved from up north for my master’s and was terrified of the whole PG hunt. The verification here matched exactly what I found on my visit — CCTV at the entrance, biometric lock, and the warden actually lives on-site. Food is homely, not restaurant-style, but portions are honest. WiFi handled my online internship calls without a single drop.',
 ['Security', 'WiFi', 'Food'],
 34,
 ),
 rev(
 'Priyanka M.',
 'PM',
 'Lived here 1 year',
 'Aug 2026',
 4,
 'Great place, just mind the winter mornings',
 'Management is genuinely responsive — I reported a broken window latch and it was fixed the same day. Only real gripe is the hot water timing in winter; the listing oversells it. Everything else — cleaning, food variety, privacy of single rooms — has been reliably good.',
 ['Maintenance', 'Management'],
 21,
 ),
 rev(
 'Rhea D.',
 'RD',
 'Current resident',
 'Jul 2026',
 5,
 'Worth the slightly higher rent',
 'Compared three PGs in before choosing this one. Rent is ₹1,000–1,500 higher than neighbours, but power backup means I never lose my work calls, and cleaning is daily — not the “weekly” most places quietly mean. Housekeeping even refills the RO without being asked.',
 ['Value', 'Cleanliness', 'Power backup'],
 18,
 ),
 ],
 },
 {
 id: 'fern-and-fig',
 name: 'Fern & Fig Women’s PG',
 type: 'PG',
 locality: 'Chittethukara',
 city: 'Kakkanad',
 landmark: ' near Chittethukara Panchayat office',
 distance: '1.3 km from 80 Feet Road',
 gender: 'Women only',
 rent: 14000,
 deposit: 25000,
 food: 'Included',
 foodType: 'Veg & non-veg, Jain options, late dinner served till 10:30 PM',
 roomTypes: ['Single sharing', 'Double sharing'],
 ac: false,
 rating: 4.3,
 reviewCount: 41,
 verified: true,
 verifiedOn: 'Sep 2026',
 art: 'window',
 categories: { cleanliness: 4.4, food: 4.5, maintenance: 4.1, management: 4.3, privacy: 4.2, value: 4.6, security: 4.3 },
 wifi: 'Good',
 wifiSpeed: '80 Mbps, stable enough for online classes',
 curfew: 'No curfew',
 garbage: 'Daily',
 cleaning: 'Daily housekeeping',
 mess: 'Home-style meals with a late-dinner window for night-class residents',
 powerBackup: true,
 security: 'Entry log book, CCTV at entrance, caretaker on ground floor till midnight',
 amenities: [
 { label: '80 Mbps WiFi', icon: 'wifi', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'Daily housekeeping', icon: 'broom', has: true },
 { label: 'RO water', icon: 'water', has: true },
 { label: 'Laundry (paid)', icon: 'laundry', has: true },
 { label: 'Study corner', icon: 'study', has: true },
 { label: 'AC rooms', icon: 'ac', has: false },
 { label: 'Attached bathroom', icon: 'bath', has: false },
 ],
 rules: [
 { label: 'Curfew', value: 'No curfew — entry logged in the register; caretaker notified if you’ll be past 1 AM', icon: 'moon' },
 { label: 'Visitors', value: 'Female visitors allowed in the ground-floor common room till 10 PM', icon: 'users' },
 { label: 'Food timings', value: 'Dinner 7:30–9:30 PM, late plate reserved till 10:30 PM on request', icon: 'utensils' },
 { label: 'Notice period', value: '30 days, deposit refunded within 7 working days', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (double sharing, with food)', amount: 14000 },
 { label: 'Electricity', amount: '₹400–900 / month', note: 'fans included, coolers metered' },
 { label: 'Laundry', amount: '₹550 / month (optional)', note: 'pick-up twice a week' },
 { label: 'Deposit (refundable)', amount: 25000 },
 ],
 highlights: [
 'Late-dinner window repeatedly praised by students with evening classes',
 'Best value-for-money score among Chittethukara PGs with no curfew',
 'Caretaker described as “present but not nosy” by 9 residents',
 ],
 concerns: [
 {
 title: 'Rooms are fan-cooled, not AC',
 detail:
 'The listing mentions “air circulation” but there is no AC in any room. 5 residents found April–May afternoons uncomfortable. Coolers are permitted in double-sharing rooms.',
 },
 {
 title: 'Shared bathrooms on each floor',
 detail:
 'Bathrooms are shared between two rooms and cleaned daily. Residents report the floor-2 bathroom has better water pressure — worth checking on your visit.',
 },
 ],
 about:
 'Fern & Fig is a 18-room women-only PG in Chittethukara occupying a quiet independent house with a small garden out front. It has no curfew — instead, a register book and a caretaker who lives on the ground floor. Meals are home-style with a late-dinner window for residents with evening classes or internships. It suits students and young professionals who want freedom of movement without the cost of a premium PG.',
 availability: '6 rooms free this month',
 landmarks: [
 { label: 'Chittethukara Panchayat office', dist: '600 m' },
 { label: '80 Feet Road', dist: '1.3 km' },
 { label: 'Bharata Mata College', dist: '2.4 km' },
 { label: 'Kakkanad Junction', dist: '2.8 km' },
 ],
 reviews: [
 rev(
 'Aishwarya R.',
 'AR',
 'Lived here 9 months',
 'Oct 2026',
 5,
 'No curfew, and it still feels safe',
 'My evening internship ends at 9:30 PM and I’ve reached home at 1 AM many times — the register system and caretaker on the ground floor mean nobody panics and I never feel unsafe. Late dinner saved me more times than I can count. Rooms are simple, fan-cooled only, but for ₹14k with food in Chittethukara, the value is excellent.',
 ['No curfew', 'Food', 'Value'],
 26,
 ),
 rev(
 'Sara Thomas',
 'ST',
 'Current resident',
 'Sep 2026',
 4,
 'Homely food, honest people',
 'The caretaker told me upfront about the shared bathrooms and fan-only rooms before I paid anything — a first in my PG hunt. Food is genuinely homely and the Jain option is properly Jain, not just “no onion”. WiFi handles my online classes fine.',
 ['Honesty', 'Food', 'WiFi'],
 19,
 ),
 rev(
 'Neha G.',
 'NG',
 'Lived here 5 months',
 'Jul 2026',
 4,
 'Freedom without the party-PG vibe',
 'No curfew doesn’t mean loud — quiet hours after 11 PM are respected, and the study corner is where most of us spend exam weeks. Only discomfort is summer afternoons without AC; I bought a cooler, allowed in my room.',
 ['Community', 'Quiet', 'AC'],
 12,
 ),
 ],
 },
 {
 id: 'sage-wings',
 name: 'Sage Wings Hostel',
 type: 'Hostel',
 locality: 'Edachira',
 city: 'Kakkanad',
 landmark: '100 Feet Road, near Kangarappady flyover',
 distance: '1.4 km from Edachira bus stop',
 gender: 'Women only',
 rent: 11000,
 deposit: 15000,
 food: 'Optional',
 foodType: 'Veg & non-veg mess on ground floor, tiffin tie-ups available',
 roomTypes: ['Double sharing', 'Triple sharing'],
 ac: true,
 rating: 4.2,
 reviewCount: 64,
 verified: true,
 verifiedOn: 'Aug 2026',
 art: 'lobby',
 categories: { cleanliness: 4.1, food: 3.9, maintenance: 4.0, management: 4.4, privacy: 4.0, value: 4.5, security: 4.4 },
 wifi: 'Good',
 wifiSpeed: '60 Mbps shared, drops during peak evenings',
 curfew: 'Fixed',
 curfewTime: 'Gate closes 10 PM; overnight out-pass with warden approval',
 garbage: 'Alternate days',
 cleaning: 'Weekly',
 mess: 'Ground-floor mess, meal timings fixed, outside food allowed in rooms',
 powerBackup: true,
 security: 'CCTV in corridors, security guard at gate till midnight, visitor log',
 amenities: [
 { label: 'WiFi', icon: 'wifi', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'AC rooms', icon: 'ac', has: true },
 { label: 'Laundry (paid)', icon: 'laundry', has: true },
 { label: 'Common kitchen', icon: 'kitchen', has: true },
 { label: 'Rooftop sit-out', icon: 'terrace', has: true },
 { label: 'Attached bathroom', icon: 'bath', has: false },
 { label: 'Gym', icon: 'gym', has: false },
 ],
 rules: [
 { label: 'Curfew', value: 'Fixed — gate closes at 10 PM sharp, out-pass needed for exceptions', icon: 'moon' },
 { label: 'Visitors', value: 'Visitors allowed only in reception till 8 PM, any gender with ID proof', icon: 'users' },
 { label: 'Food timings', value: 'Mess closes at 9 PM; common kitchen usable till 10 PM', icon: 'utensils' },
 { label: 'Notice period', value: '15 days, deposit adjusted against dues first', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (double sharing, no food)', amount: 11000 },
 { label: 'Mess (optional)', amount: '₹3,200 / month', note: 'lunch + dinner' },
 { label: 'Electricity', amount: '₹500 flat (AC rooms metered separately)', note: '₹400–900 typical' },
 { label: 'Deposit (refundable)', amount: 15000 },
 ],
 highlights: [
 'Cheapest verified option in Edachira with AC and power backup',
 'Common kitchen is a frequent highlight — residents cook on weekends',
 'Rooftop sit-out is described as calm and well-lit, safe till late',
 ],
 concerns: [
 {
 title: 'Curfew is stricter than the listing implies',
 detail:
 'The listing says “10 PM gate closure with flexible out-passes”. 9 verified residents report overnight out-passes are rarely approved on weekdays. Havenly has requested a clearer rules update from management; status: in review.',
 },
 {
 title: 'WiFi congestion in the evenings',
 detail:
 '11 residents reported speeds fall sharply between 8–11 PM, likely due to shared bandwidth across 60+ rooms. A few described it as unusable for video calls during that window.',
 },
 ],
 about:
 'Sage Wings is a purpose-built four-storey women’s hostel on a busy stretch of Edachira 100 Feet Road. It offers furnished-sharing rooms with a ground-floor mess, a small common kitchen, and a rooftop sit-out. It suits budget-conscious students and working women who want a central location over luxury. The building is a 10-minute walk from the Edachira bus stop, with buses and autos available at all hours.',
 availability: 'Waitlist for single rooms; sharing rooms free now',
 landmarks: [
 { label: 'Edachira bus stop', dist: '1.4 km' },
 { label: '100 Feet Road bus stop', dist: '200 m' },
 { label: 'DMart Edachira', dist: '900 m' },
 { label: 'Infopark Phase 1', dist: '4.5 km' },
 ],
 reviews: [
 rev(
 'Sneha K.',
 'SK',
 'Lived here 6 months',
 'Sep 2026',
 4,
 'Central, budget-friendly, but mind the curfew',
 'Location is unbeatable for the price — I save 40 minutes of commute daily. The 10 PM curfew is real though; if you work night shifts, look elsewhere. Mess food is average but the optional plan means you can skip it and use the common kitchen instead.',
 ['Location', 'Budget', 'Curfew'],
 27,
 ),
 rev(
 'Megha T.',
 'MT',
 'Current resident',
 'Aug 2026',
 4,
 'Common kitchen won me over',
 'Being able to cook my own food saves me ₹3,000 a month compared to friends in PGs with mandatory mess. Cleaning could be better — bathrooms are cleaned weekly and it shows by day five. Guard and visitor log system make me feel safe.',
 ['Food', 'Value', 'Cleaning'],
 15,
 ),
 rev(
 'Divya R.',
 'DR',
 'Lived here 4 months',
 'Jun 2026',
 4,
 'Good for a first year in the city',
 'The warden helped me find aAuto and gave me a list of safe clinics nearby — small things that matter when you’re new. Evening WiFi congestion is genuine; I finish heavy uploads before 8 PM. Still, for ₹11k in Edachira with AC, it’s honest value.',
 ['Management', 'WiFi'],
 12,
 ),
 ],
 },
 {
 id: 'marigold-court',
 name: 'Marigold Court Residences',
 type: 'PG',
 locality: 'Padamugal',
 city: 'Kakkanad',
 landmark: 'Sector 2, near Padamugal Panchayat office',
 distance: '800 m from Panchayat office',
 gender: 'Women only',
 rent: 16500,
 deposit: 50000,
 food: 'Included',
 foodType: 'Veg & non-veg, chef-prepared, Jain options on request',
 roomTypes: ['Single sharing (AC)', 'Double sharing (AC)'],
 ac: true,
 rating: 4.7,
 reviewCount: 52,
 verified: true,
 verifiedOn: 'Oct 2026',
 art: 'room',
 categories: { cleanliness: 4.9, food: 4.8, maintenance: 4.6, management: 4.6, privacy: 4.9, value: 4.3, security: 4.9 },
 wifi: 'Excellent',
 wifiSpeed: '150 Mbps dedicated line per floor',
 curfew: 'No curfew',
 garbage: 'Daily',
 cleaning: 'Daily housekeeping, linen change weekly',
 mess: 'Chef-prepared meals, live menu voting in residents’ WhatsApp group',
 powerBackup: true,
 security: 'Smart-lock entry, CCTV with phone app access for residents, 24×7 security',
 amenities: [
 { label: '150 Mbps WiFi', icon: 'wifi', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'AC rooms', icon: 'ac', has: true },
 { label: 'Laundry (paid)', icon: 'laundry', has: true },
 { label: 'Attached bathroom', icon: 'bath', has: true },
 { label: 'Housekeeping daily', icon: 'broom', has: true },
 { label: 'Rooftop garden', icon: 'terrace', has: true },
 { label: 'Work-from-home lounge', icon: 'study', has: true },
 ],
 rules: [
 { label: 'Curfew', value: 'No curfew — smart-lock entry logs every in/out for safety', icon: 'moon' },
 { label: 'Visitors', value: 'Visitors permitted in rooms with 2-hour advance notice to warden', icon: 'users' },
 { label: 'Food timings', value: 'All-day pantry with tea/coffee; meals at fixed hours', icon: 'utensils' },
 { label: 'Notice period', value: '45 days; deposit refunded in full within 10 days', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (single sharing, AC, with food)', amount: 16500 },
 { label: 'Electricity', amount: 'Actuals, metered per room', note: '₹600–1,200 typical' },
 { label: 'Laundry', amount: '₹750 / month (optional)', note: 'picks twice a week' },
 { label: 'Deposit (refundable)', amount: 50000 },
 ],
 highlights: [
 'Highest-rated property on Havenly in Padamugal for cleanliness',
 'No curfew with smart-lock logging — repeatedly cited as “liberal but safe”',
 'Food quality consistently praised; menu voting mentioned by 14 residents',
 ],
 concerns: [
 {
 title: 'Deposit is higher than locality average',
 detail:
 'The ₹50,000 deposit is roughly ₹15,000 above similar PGs in Padamugal Sector 2. 6 residents noted refunds arrived on time, but the upfront amount is a real barrier. Listed here for transparency.',
 },
 {
 title: 'Single-sharing rooms rarely open up',
 detail:
 'Demand consistently exceeds supply — 3 residents reported waits of 1–2 months for a single room. Sharing options are usually available.',
 },
 ],
 about:
 'Marigold Court is a premium 14-room women’s PG in a quiet Padamugal sector, set in a converted villa with a rooftop garden. Rooms are single or double sharing with attached bathrooms, work desks and AC. The in-house chef prepares all meals, with Jain and low-oil options on request. It attracts working professionals from the Padamugal–Infopark Phase 2 corridor and remote workers who value the WFH lounge.',
 availability: '2 sharing rooms free; single-sharing waitlist open',
 landmarks: [
 { label: 'Padamugal Panchayat office', dist: '800 m' },
 { label: 'Padamugal layout club', dist: '1.1 km' },
 { label: 'Cafe street', dist: '1.5 km' },
 { label: 'Infopark Phase 2 (by road)', dist: '9 km' },
 ],
 reviews: [
 rev(
 'Kavya N.',
 'KN',
 'Lived here 10 months',
 'Oct 2026',
 5,
 'Expensive, and I would pay it again',
 'The no-curfew policy with smart-lock logging was the decider — I work night shifts and never once felt unsafe coming home at 1 AM. Housekeeping is genuinely daily, food is the best I’ve had in any PG. The high deposit stung, but it came back in full within a week of moving out.',
 ['No curfew', 'Food', 'Security'],
 41,
 ),
 rev(
 'Ishita B.',
 'IB',
 'Current resident',
 'Sep 2026',
 5,
 'The WFH lounge is quietly excellent',
 'Soundproofed booths, stable 150 Mbps, and nobody minds calls running long. Cleanliness standards are hotel-like — my bathroom gets cleaned daily without fail. Only complaint is how hard it was to get a single room; I waited 6 weeks.',
 ['WiFi', 'Cleanliness', 'Work-from-home'],
 29,
 ),
 rev(
 'Tanvi L.',
 'TL',
 'Lived here 5 months',
 'Jul 2026',
 4,
 'Great food, slightly formal vibe',
 'Food is restaurant-quality and menu voting is a nice touch. The place is very well run but can feel a bit like a hotel rather than a home if you like a chatty PG community. Management is professional and responds within hours.',
 ['Food', 'Management'],
 17,
 ),
 ],
 },
 {
 id: 'the-nest-coliving',
 name: 'The Nest Co-living',
 type: 'Shared Rental',
 locality: 'Chittethukara',
 city: 'Kakkanad',
 landmark: ' near Sunrise Hospital road',
 distance: '1.1 km from 80 Feet Road',
 gender: 'Women only floor in co-ed building',
 rent: 15000,
 deposit: 40000,
 food: 'Not included',
 foodType: 'Shared kitchen; Swiggy/Zomato friendly; no mess',
 roomTypes: ['1 BHK', 'Studio', 'Single room in 3 BHK'],
 ac: true,
 rating: 4.1,
 reviewCount: 38,
 verified: true,
 verifiedOn: 'Jul 2026',
 art: 'kitchen',
 categories: { cleanliness: 4.3, food: 3.6, maintenance: 4.2, management: 4.0, privacy: 4.5, value: 4.2, security: 4.0 },
 wifi: 'Excellent',
 wifiSpeed: '200 Mbps, mesh routers',
 curfew: 'No curfew',
 garbage: 'Daily',
 cleaning: 'Common areas weekly, rooms self-service',
 mess: 'No mess — fully equipped shared kitchen with fridge, oven, dishwasher',
 powerBackup: true,
 security: 'CCTV in common areas, gender-segregated floors, app-based visitor approval',
 amenities: [
 { label: '200 Mbps WiFi', icon: 'wifi', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'AC rooms', icon: 'ac', has: true },
 { label: 'Shared kitchen', icon: 'kitchen', has: true },
 { label: 'Dishwasher & oven', icon: 'kitchen', has: true },
 { label: 'Work lounge', icon: 'study', has: true },
 { label: 'Daily housekeeping', icon: 'broom', has: false },
 { label: 'Laundry in-unit', icon: 'laundry', has: true },
 ],
 rules: [
 { label: 'Curfew', value: 'No curfew, 24×7 app-based entry', icon: 'moon' },
 { label: 'Visitors', value: 'Visitors allowed with app approval; quiet hours after 10 PM', icon: 'users' },
 { label: 'Kitchen', value: 'Shared kitchen, cleaning rota in place', icon: 'utensils' },
 { label: 'Notice period', value: '30 days or one month rent in lieu', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (single room in 3 BHK)', amount: 15000 },
 { label: 'Utilities split', amount: '₹1,200–2,000 / month', note: 'electricity + water, split with flatmates' },
 { label: 'Housekeeping add-on', amount: '₹1,000 / month (optional)', note: 'room cleaning twice a week' },
 { label: 'Deposit (refundable)', amount: 40000 },
 ],
 highlights: [
 'Most independent option — no curfew, no mess compulsion, in-unit laundry',
 'Gender-segregated floors in a co-ed building, noted positively by 8 residents',
 'Dishwasher and oven repeatedly called out as “genuinely life-saving”',
 ],
 concerns: [
 {
 title: 'Room cleaning is not included by default',
 detail:
 'Common areas are cleaned weekly, but rooms are self-service unless you pay the ₹1,000 add-on. The listing’s “housekeeping” wording has confused some applicants — clarified here.',
 },
 {
 title: 'Co-ed building — women’s floor only',
 detail:
 'The building is co-ed with a women-only floor and separate lift access. 4 residents said this was fine; 2 preferred a fully women-only building. Worth weighing before booking.',
 },
 ],
 about:
 'The Nest is a co-living property occupying two floors of an apartment building in Chittethukara with a dedicated women-only floor. Rooms range from single rooms in shared 3 BHKs to private studios. There is no mess — instead, a large shared kitchen with modern appliances, a work lounge, and a rooftop. It suits working professionals who want flat-style independence without the hassle of setting up a rental alone.',
 availability: '3 rooms free across 3 BHKs; studio waitlist',
 landmarks: [
 { label: 'Sunrise Hospital road', dist: '450 m' },
 { label: '80 Feet Road', dist: '1.1 km' },
 { label: 'Chittethukara Social', dist: '1.6 km' },
 { label: 'Ejipura bus stop', dist: '700 m' },
 ],
 reviews: [
 rev(
 'Nikita A.',
 'NA',
 'Current resident',
 'Sep 2026',
 4,
 'Feels like a flat, not a PG',
 'I cook my own meals and the kitchen has a dishwasher — after two years of PG mess food, this is freedom. The women-only floor with separate lift access is what convinced my parents. Housekeeping for rooms is extra, which the listing makes clear on the profile.',
 ['Independence', 'Kitchen', 'Privacy'],
 22,
 ),
 rev(
 'Shreya P.',
 'SP',
 'Lived here 7 months',
 'Aug 2026',
 4,
 'Great for work, depends on flatmates',
 '200 Mbps WiFi and a quiet work lounge made remote work easy. The real variable is who your flatmates are — my first flat was messy, second one was lovely. Management swapped me without drama, which I appreciated.',
 ['WiFi', 'Flatmates', 'Management'],
 14,
 ),
 rev(
 'Aarti G.',
 'AG',
 'Lived here 3 months',
 'Jun 2026',
 4,
 'Independent living, minus the setup hassle',
 'No broker, no furniture shopping, no electricity deposit games — everything was ready. Utilities split fairly with receipts shared in the group. Would love if room cleaning were included by default rather than as an add-on.',
 ['Convenience', 'Transparency'],
 9,
 ),
 ],
 },
 {
 id: 'lilac-lane',
 name: 'Lilac Lane Ladies Hostel',
 type: 'Hostel',
 locality: 'Vazhakkala',
 city: 'Kakkanad',
 landmark: ' near Civil Station signal',
 distance: '1 km from Vazhakkala market',
 gender: 'Women only',
 rent: 8500,
 deposit: 10000,
 food: 'Included',
 foodType: 'Pure veg, home-style, twice-cooked rice meals',
 roomTypes: ['Triple sharing', 'Double sharing'],
 ac: false,
 rating: 3.8,
 reviewCount: 96,
 verified: true,
 verifiedOn: 'Jun 2026',
 art: 'window',
 categories: { cleanliness: 3.7, food: 4.1, maintenance: 3.4, management: 3.9, privacy: 3.4, value: 4.4, security: 4.0 },
 wifi: 'Average',
 wifiSpeed: '25 Mbps shared router, one per floor',
 curfew: 'Fixed',
 curfewTime: 'Gate closes 9 PM; students given till 9:30 with ID card',
 garbage: 'Alternate days',
 cleaning: 'Weekly',
 mess: 'Pure veg home-style, fixed menu board, no exceptions for non-veg',
 powerBackup: false,
 security: 'Security guard till midnight, CCTV at entrance only',
 amenities: [
 { label: 'WiFi', icon: 'wifi', has: true },
 { label: 'Mess (veg)', icon: 'utensils', has: true },
 { label: 'Study hall', icon: 'study', has: true },
 { label: 'RO water', icon: 'water', has: true },
 { label: 'Power backup', icon: 'power', has: false },
 { label: 'AC rooms', icon: 'ac', has: false },
 { label: 'Attached bathroom', icon: 'bath', has: false },
 { label: 'Laundry service', icon: 'laundry', has: true },
 ],
 rules: [
 { label: 'Curfew', value: 'Fixed — gate closes at 9 PM, no exceptions on weekdays', icon: 'moon' },
 { label: 'Visitors', value: 'Parents/siblings only, till 6 PM, at reception', icon: 'users' },
 { label: 'Food', value: 'Pure veg mess, Jain options available on prior notice', icon: 'utensils' },
 { label: 'Notice period', value: '15 days, deposit adjusted for damages if any', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (triple sharing, with food)', amount: 8500 },
 { label: 'Electricity', amount: '₹300–700 / month', note: 'fans metered in some blocks' },
 { label: 'Laundry', amount: '₹450 / month (optional)', note: 'iron extra' },
 { label: 'Deposit (refundable)', amount: 10000 },
 ],
 highlights: [
 'Lowest-priced verified option in our Vazhakkala listings',
 'Mess food described as genuinely “home-like” by long-stay residents',
 'Popular with students — study hall stays open till 11 PM',
 ],
 concerns: [
 {
 title: 'No power backup — outages affect study and safety',
 detail:
 '14 residents reported power cuts of 30–90 minutes with no backup; corridors go dark and lift (in Block B) stops. This is flagged prominently because it affects both comfort and safety at night.',
 },
 {
 title: 'Facilities differ by block',
 detail:
 'Block A has newer bathrooms and better WiFi than Block C. The listing presents the property as uniform. Havenly recommends visiting and asking which block a room is in before paying.',
 },
 ],
 about:
 'Lilac Lane is a long-running women’s hostel in Vazhakkala popular with students of Kakkanad University and nursing trainees at nearby hospitals. It offers simple furnished rooms with a pure-veg mess and a study hall open till 11 PM. It is the most budget-friendly verified option in the area, though facilities are basic and vary between blocks.',
 availability: 'Plenty of triple-sharing rooms; Block A fills first',
 landmarks: [
 { label: 'Vazhakkala market', dist: '1 km' },
 { label: 'Civil Station Hospital', dist: '1.3 km' },
 { label: 'Vazhakkala bus stop', dist: '1.6 km' },
 { label: 'Kakkanad University', dist: '3 km' },
 ],
 reviews: [
 rev(
 'Lakshmi V.',
 'LV',
 'Lived here 1 year',
 'Sep 2026',
 4,
 'Affordable and honest, just basic',
 'If you want AC and power backup, this isn’t it. For ₹8,500 with three meals in Vazhakkala, it’s fair. The mess food genuinely tastes like home, and the study hall helped me crack my exams. Insist on a Block A room.',
 ['Budget', 'Food', 'Study space'],
 31,
 ),
 rev(
 'Pooja H.',
 'PH',
 'Current resident',
 'Jul 2026',
 3,
 'The 9 PM curfew is strict',
 'My evening classes end at 8:45 PM and I’ve been late past curfew twice — the guard does not bend. WiFi is weak for online classes; I use mobile data. Cleaners come weekly, which for the price feels fair but not luxurious.',
 ['Curfew', 'WiFi', 'Cleaning'],
 24,
 ),
 rev(
 'Reshma K.',
 'RK',
 'Lived here 8 months',
 'May 2026',
 4,
 'Safe, simple, watch for power cuts',
 'As a student away from home, safety was my parents’ first concern and the hostel delivers — guard at gate, parents-only visitor policy, no male staff inside. Power cuts without backup are the one real problem; keep a torch ready.',
 ['Safety', 'Power backup'],
 19,
 ),
 ],
 },
 {
 id: 'verdant-haven',
 name: 'Verdant Haven PG for Women',
 type: 'PG',
 locality: 'Thrikkakara',
 city: 'Kakkanad',
 landmark: 'Near Thrikkakara circle',
 distance: '900 m from Thrikkakara market',
 gender: 'Women only',
 rent: 12000,
 deposit: 25000,
 food: 'Included',
 foodType: 'Veg & non-veg, South-Indian style meals',
 roomTypes: ['Single sharing', 'Double sharing'],
 ac: false,
 rating: 4.4,
 reviewCount: 71,
 verified: true,
 verifiedOn: 'Sep 2026',
 art: 'terrace',
 categories: { cleanliness: 4.5, food: 4.6, maintenance: 4.2, management: 4.5, privacy: 4.4, value: 4.7, security: 4.5 },
 wifi: 'Good',
 wifiSpeed: '75 Mbps, stable but shared',
 curfew: 'Flexible',
 curfewTime: 'Gate open till 11 PM, intimation required after 9:30 PM',
 garbage: 'Daily',
 cleaning: 'Daily housekeeping',
 mess: 'South-Indian style meals, extra curd rice on request — a resident favourite',
 powerBackup: true,
 security: 'CCTV in common areas, live-in caretaker, grilled windows',
 amenities: [
 { label: 'WiFi', icon: 'wifi', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'Daily housekeeping', icon: 'broom', has: true },
 { label: 'RO water', icon: 'water', has: true },
 { label: 'Terrace access', icon: 'terrace', has: true },
 { label: 'Laundry (paid)', icon: 'laundry', has: true },
 { label: 'AC rooms', icon: 'ac', has: false },
 { label: 'Attached bathroom', icon: 'bath', has: false },
 ],
 rules: [
 { label: 'Curfew', value: 'Flexible — open till 11 PM, call the caretaker if you’ll be later', icon: 'moon' },
 { label: 'Visitors', value: 'Female visitors allowed upstairs with caretaker informed', icon: 'users' },
 { label: 'Food timings', value: 'Meals at fixed hours; kitchen serves curd rice till 10 PM', icon: 'utensils' },
 { label: 'Notice period', value: '30 days, full deposit refund with no deductions reported', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (double sharing, with food)', amount: 12000 },
 { label: 'Electricity', amount: '₹400–900 / month', note: 'fans included, AC rooms not available' },
 { label: 'Laundry', amount: '₹500 / month (optional)', note: 'weekly pick-up' },
 { label: 'Deposit (refundable)', amount: 25000 },
 ],
 highlights: [
 'Best value-for-money score across all our Thrikkakara listings',
 'Food described as “exactly like home” by 19 verified residents',
 'Caretaker praised for fast issue resolution — median response under 4 hours',
 ],
 concerns: [
 {
 title: 'No AC — afternoons can be uncomfortable',
 detail:
 'Rooms are fan-cooled only. Multiple residents noted April–May afternoons are hard without AC, and the listing does not state this prominently. Ceiling fans are new, per resident reports from March 2026.',
 },
 {
 title: 'Shared bathrooms in double-sharing floors',
 detail:
 'Bathrooms are shared between two rooms, not attached. Cleaned daily, but worth knowing if you prefer attached facilities.',
 },
 ],
 about:
 'Verdant Haven is a homely 16-room women’s PG on a leafy Thrikkakara cross street, run by a caretaker family who lives on the ground floor. Rooms are simple but well-kept, with daily housekeeping and a terrace where residents dry clothes and unwind in the evenings. It is a favourite among students of RV College and professionals working in the Thrikkakara–Sadashivanagar belt, and is known for its South-Indian mess food.',
 availability: '5 rooms free this month',
 landmarks: [
 { label: 'Thrikkakara market', dist: '900 m' },
 { label: 'Thrikkakara bus stop', dist: '1.5 km' },
 { label: 'Rajajinagar IT Park', dist: '3 km' },
 { label: 'Sankey Tank', dist: '2.2 km' },
 ],
 reviews: [
 rev(
 'Sushmitha R.',
 'SR',
 'Lived here 1 year',
 'Oct 2026',
 5,
 'The home-cooked food is the whole experience',
 'I’ve stayed in four PGs in Kakkanad and none matched this mess. The caretaker aunty remembers when you’re unwell and sends curd rice up to your room. Cleaning is daily, WiFi is stable enough for classes. No AC is the only real compromise.',
 ['Food', 'Cleanliness', 'Care'],
 38,
 ),
 rev(
 'Deepa N.',
 'DN',
 'Current resident',
 'Sep 2026',
 4,
 'Great value, old building',
 'For ₹12,000 with all meals and daily cleaning in Thrikkakara, the value is hard to beat. Building is old — expect creaky stairs and shared bathrooms. The flexible curfew with a quick call to the caretaker works well for my evening classes.',
 ['Value', 'Curfew', 'Building'],
 20,
 ),
 rev(
 'Harini M.',
 'HM',
 'Lived here 6 months',
 'Aug 2026',
 4,
 'Felt like family within a month',
 'Terrace evenings with other residents became my favourite part. Deposits came back in full when my friend left — no deductions despite a stained wall, which the caretaker said was normal wear. Only wish there were attached bathrooms.',
 ['Community', 'Deposit', 'Facilities'],
 16,
 ),
 ],
 },
 {
 id: 'aurora-crest',
 name: 'Aurora Crest Ladies Hostel',
 type: 'Hostel',
 locality: 'Kusumagiri',
 city: 'Kakkanad',
 landmark: 'ITPL Main Road, near Hope Farm junction',
 distance: '1.2 km from ITPL',
 gender: 'Women only',
 rent: 14000,
 deposit: 20000,
 food: 'Included',
 foodType: 'Veg & non-veg buffet, live counter on weekends',
 roomTypes: ['Double sharing', 'Single sharing'],
 ac: true,
 rating: 4.0,
 reviewCount: 45,
 verified: false,
 art: 'building',
 categories: { cleanliness: 4.0, food: 4.2, maintenance: 3.8, management: 4.1, privacy: 3.9, value: 4.0, security: 4.2 },
 wifi: 'Good',
 wifiSpeed: '100 Mbps, building-wide',
 curfew: 'Flexible',
 curfewTime: 'Gate open till 11 PM, shuttle till 10:30 PM from ITPL',
 garbage: 'Daily',
 cleaning: 'Daily housekeeping',
 mess: 'Buffet-style, weekend live counter, rotating cuisines',
 powerBackup: true,
 security: 'CCTV throughout, security desk 24×7, shuttle service evenings',
 amenities: [
 { label: '100 Mbps WiFi', icon: 'wifi', has: true },
 { label: 'AC rooms', icon: 'ac', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'Shuttle to ITPL', icon: 'bus', has: true },
 { label: 'Gym', icon: 'gym', has: true },
 { label: 'Laundry (paid)', icon: 'laundry', has: true },
 { label: 'Attached bathroom', icon: 'bath', has: false },
 { label: 'Study hall', icon: 'study', has: true },
 ],
 rules: [
 { label: 'Curfew', value: 'Flexible — gate open till 11 PM, register at security desk', icon: 'moon' },
 { label: 'Visitors', value: 'Visitors allowed in common areas till 9 PM with ID', icon: 'users' },
 { label: 'Food timings', value: 'Buffet hours fixed; packed breakfast on request', icon: 'utensils' },
 { label: 'Notice period', value: '30 days, deposit refunded within 15 days', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (double sharing, with food)', amount: 14000 },
 { label: 'Electricity', amount: '₹600–1,100 / month', note: 'AC metered per room' },
 { label: 'Laundry', amount: '₹650 / month (optional)', note: 'twice-weekly pick-up' },
 { label: 'Deposit (refundable)', amount: 20000 },
 ],
 highlights: [
 'Free evening shuttle to ITPL — cited as a top reason for choosing it',
 'Weekend food live-counter is a consistent highlight in reviews',
 'On-site gym included in rent, unusual at this price point',
 ],
 concerns: [
 {
 title: 'Platform verification pending',
 detail:
 'Havenly has not yet completed an on-site verification for this property. The owner has submitted documents and a visit is scheduled. Reviews below are from verified residents, but the listing details (facilities, charges) are owner-provided and unchecked.',
 },
 {
 title: 'WiFi shared across the whole building',
 detail:
 '9 residents reported slowdowns around 9–11 PM when the shuttle-wait crowd uses the network. Speeds are fine for browsing and classes; heavy uploads may struggle.',
 },
 ],
 about:
 'Aurora Crest is a large women’s hostel on ITPL Main Road, Kusumagiri, catering mainly to IT professionals working in the Kusumagiri–ITPL belt. Facilities include an on-site gym, a buffet mess with weekend live counters, and an evening shuttle to ITPL. Rooms are double or single sharing with AC. Platform verification is currently in progress; resident reviews are verified independently.',
 availability: '8 rooms free; shuttle seats limited',
 landmarks: [
 { label: 'ITPL', dist: '1.2 km' },
 { label: 'Hope Farm bus stop (Purple line)', dist: '1 km' },
 { label: 'Phoenix Marketcity', dist: '3.5 km' },
 { label: 'Manipal Hospital Kusumagiri', dist: '2 km' },
 ],
 reviews: [
 rev(
 'Vaishnavi C.',
 'VC',
 'Current resident',
 'Sep 2026',
 4,
 'The shuttle makes my life',
 'Living 1.2 km from office without the stress of that last-mile auto at 10 PM is everything. Gym is basic but usable, food is better than most hostel buffets I’ve tried. WiFi does slow down at night when everyone’s online.',
 ['Shuttle', 'Food', 'WiFi'],
 18,
 ),
 rev(
 'Ritika J.',
 'RJ',
 'Lived here 5 months',
 'Aug 2026',
 4,
 'Comfortable, pending verification check',
 'I booked before the verification was listed as pending, and honestly the place matched the photos. Single rooms are small but functional. Management is professional. Would still recommend a personal visit — the shuttle timing especially.',
 ['Room', 'Management', 'Visit'],
 13,
 ),
 rev(
 'Namrata S.',
 'NS',
 'Lived here 8 months',
 'Jun 2026',
 4,
 'Solid for Kusumagiri IT life',
 'Cleanliness is consistent, security desk actually checks IDs. The gym gets crowded on weekends. Deposits took the full 15 days to return — as stated, no surprises.',
 ['Security', 'Gym', 'Deposit'],
 10,
 ),
 ],
 },
 {
 id: 'casa-amor',
 name: 'Casa Amor Shared Home',
 type: 'Shared Rental',
 locality: 'Edachira',
 city: 'Kakkanad',
 landmark: 'Defence Colony, near Chinmaya Mission Hospital',
 distance: '700 m from Edachira junction',
 gender: 'Women only',
 rent: 17500,
 deposit: 45000,
 food: 'Not included',
 foodType: 'Shared kitchen; 4 flatmates, cooking rota in practice',
 roomTypes: ['Single room in 2 BHK', 'Single room in 3 BHK'],
 ac: true,
 rating: 4.5,
 reviewCount: 24,
 verified: true,
 verifiedOn: 'Oct 2026',
 art: 'lobby',
 categories: { cleanliness: 4.6, food: 3.9, maintenance: 4.4, management: 4.3, privacy: 4.7, value: 4.1, security: 4.5 },
 wifi: 'Excellent',
 wifiSpeed: '300 Mbps, per-flat connection',
 curfew: 'No curfew',
 garbage: 'Daily',
 cleaning: 'Maid twice a week, rooms self-service',
 mess: 'No mess — 4 women sharing a full 3 BHK with modern kitchen',
 powerBackup: true,
 security: 'Gated community with guard, CCTV in society common areas',
 amenities: [
 { label: '300 Mbps WiFi', icon: 'wifi', has: true },
 { label: 'AC in all rooms', icon: 'ac', has: true },
 { label: 'Power backup', icon: 'power', has: true },
 { label: 'Full kitchen', icon: 'kitchen', has: true },
 { label: 'Washing machine', icon: 'laundry', has: true },
 { label: 'Balcony', icon: 'terrace', has: true },
 { label: 'Gated society', icon: 'shield', has: true },
 { label: 'Housekeeping', icon: 'broom', has: false },
 ],
 rules: [
 { label: 'Curfew', value: 'No curfew — gated society with 24×7 guard', icon: 'moon' },
 { label: 'Visitors', value: 'Flatmates’ consent required for overnight guests', icon: 'users' },
 { label: 'Kitchen', value: 'Shared cooking, cleaning rota among flatmates', icon: 'utensils' },
 { label: 'Notice period', value: '30 days; find replacement or forfeit one month', icon: 'calendar' },
 ],
 costs: [
 { label: 'Rent (single room in 3 BHK)', amount: 17500 },
 { label: 'Utilities split', amount: '₹1,500–2,500 / month', note: 'split 4 ways with receipts' },
 { label: 'Maid', amount: 'Included (twice weekly)', note: 'rooms self-service' },
 { label: 'Deposit (refundable)', amount: 45000 },
 ],
 highlights: [
 'Apartment-style privacy with flatmates vetted through Havenly verification',
 'Highest WiFi speed in our listings — 300 Mbps per flat',
 'Gated society with 24×7 guard, repeatedly cited for safety',
 ],
 concerns: [
 {
 title: 'Flatmate compatibility decides everything',
 detail:
 '3 residents described minor friction over kitchen cleaning and guest policies. Havenly provides a flatmate-agreement template during booking, but compatibility cannot be guaranteed by any platform.',
 },
 {
 title: 'Rent is above PG averages for the area',
 detail:
 'At ₹17,500 plus utilities, this is among our priciest listings. It buys independence and privacy, not premium amenities — worth weighing against full-service PGs.',
 },
 ],
 about:
 'Casa Amor is a private 3 BHK in an Edachira Defence Colony gated society, shared by four women. Each gets a furnished single room; common areas include a full kitchen, balcony and living room. It is aimed at working women who want flat-style living without broker hassle or the uncertainty of finding flatmates alone. All flatmates go through Havenly residence verification, and a flatmate agreement is signed before move-in.',
 availability: '1 room free in the 3 BHK from November',
 landmarks: [
 { label: 'Edachira junction', dist: '700 m' },
 { label: 'Chinmaya Mission Hospital', dist: '500 m' },
 { label: 'Edachira bus stop', dist: '1.8 km' },
 { label: 'Belly & Beyond (pet cafe)', dist: '1 km' },
 ],
 reviews: [
 rev(
 'Aditi W.',
 'AW',
 'Current resident',
 'Oct 2026',
 5,
 'Finally, a home and not just a room',
 'Cooking with flatmates on Sundays, a balcony of my own, nobody asking why I came home late — this is what I wanted after three years of PGs. The gated society means my parents sleep easy. Knowing all flatmates are verified residents helped everyone relax.',
 ['Privacy', 'Flatmates', 'Safety'],
 15,
 ),
 rev(
 'Manasa B.',
 'MB',
 'Lived here 4 months',
 'Sep 2026',
 4,
 'Great flat, adjust expectations on costs',
 'The flat itself is lovely — 300 Mbps WiFi, AC everywhere, maid comes twice a week. But rent plus utilities comes to ~₹19,500. For that price you’re paying for independence, not luxury. Fine by me; just know it going in.',
 ['Cost', 'WiFi', 'Convenience'],
 11,
 ),
 rev(
 'Trisha F.',
 'TF',
 'Lived here 6 months',
 'Aug 2026',
 5,
 'The verification made the difference',
 'My biggest fear was unknown flatmates. Everyone here passed Havenly’s verification, and the flatmate agreement sorted chores and guests before issues started. That structure is what made it work.',
 ['Verification', 'Agreement', 'Community'],
 14,
 ),
 ],
 },
]

export const cities = Array.from(new Set(properties.map((p) => p.city)))

export const localities = Array.from(new Set(properties.map((p) => p.locality)))

export const getProperty = (id?: string) => properties.find((p) => p.id === id)
