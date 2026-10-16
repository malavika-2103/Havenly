// npm run purge:demo — removes every row with data_source = 'demo_seed' in one transaction.
import { getDb } from '../src/db'
import { purgeDemo } from '../src/services/demoData'

const db = getDb()
const removed = db.transaction(() => purgeDemo(db))()
const total = Object.values(removed).reduce((s, n) => s + n, 0)
console.log(`Removed ${total} demo_seed rows:`)
for (const [t, n] of Object.entries(removed)) if (n) console.log(`  ${t}: ${n}`)
console.log('Rows from real users (user_submitted) and manually verified data were kept. Run `npm run seed` to restore the demo.')
