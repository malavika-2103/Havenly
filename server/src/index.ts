import { createApp } from './app'
import { config } from './config'
import { getDb } from './db'

const db = getDb()
const count = (db.prepare('SELECT COUNT(*) AS n FROM properties').get() as { n: number }).n

createApp().listen(config.port, () => {
  console.log(`Havenly API on http://localhost:${config.port}/api  (area: ${config.activeArea}, properties: ${count})`)
  if (count === 0) console.log('No properties yet. Run: npm run seed')
})
