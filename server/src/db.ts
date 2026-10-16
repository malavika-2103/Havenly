import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { config, SERVER_ROOT } from './config'

export type DB = Database.Database

let instance: DB | null = null

/** Create the schema if missing. Safe to run on every start. */
export function migrate(db: DB) {
  const sql = fs.readFileSync(path.join(SERVER_ROOT, 'src', 'schema.sql'), 'utf8')
  db.exec(sql)
}

export function openDb(file = config.dbPath): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

export function getDb(): DB {
  if (!instance) instance = openDb()
  return instance
}

export const nowIso = () => new Date().toISOString()

/** SQLite stores booleans as 0/1. */
export const bool = (v: unknown) => v === 1 || v === true

export const parseJson = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}
