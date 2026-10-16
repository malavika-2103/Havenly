import type { DB } from '../db'
import { bool, nowIso, parseJson } from '../db'
import { config } from '../config'
import { badRequest, conflict, notFound } from '../lib/http'
import type { NewReviewInput, Review, ReviewSummary, ReviewType } from '../../../shared/types'
import { randomUUID } from 'node:crypto'

export const CATEGORIES = [
  ['cleanliness', 'Cleanliness'],
  ['food_quality', 'Food quality'],
  ['maintenance', 'Maintenance'],
  ['management', 'Management'],
  ['privacy', 'Privacy'],
  ['value_for_money', 'Value for money'],
  ['security', 'Feeling of security'],
] as const

const REVIEW_TYPES: ReviewType[] = ['general', 'tip', 'expectation_vs_reality', 'hidden_cost', 'rule_experience', 'safety_report']
const MIN_FOR_SUMMARY = 3
const AUTO_FLAG_REPORTS = 3

type Row = Record<string, any>

export function reviewSummary(db: DB, propertyId: string): ReviewSummary {
  const rows = db.prepare(`SELECT * FROM reviews WHERE property_id = ? AND moderation_status = 'approved'`).all(propertyId) as Row[]
  const count = rows.length
  const enough = count >= MIN_FOR_SUMMARY
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null)
  const distribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } as ReviewSummary['distribution']
  rows.forEach((r) => distribution[String(r.overall_rating) as keyof typeof distribution]++)
  return {
    count,
    average: enough ? avg(rows.map((r) => r.overall_rating)) : null,
    enough,
    message: count === 0 ? 'No reviews yet' : enough ? null : `Not enough reviews yet (${count} so far). We show a rating from ${MIN_FOR_SUMMARY} reviews.`,
    categories: CATEGORIES.map(([key, labelText]) => {
      const vals = rows.map((r) => r[`rating_${key}`]).filter((v): v is number => v != null)
      return { key, label: labelText, average: enough ? avg(vals) : null, count: vals.length }
    }),
    distribution,
    verified_resident_count: rows.filter((r) => r.residency_verification === 'approved').length,
  }
}

export function toReview(r: Row): Review {
  return {
    id: r.id,
    property: { slug: r.p_slug, name: r.p_name, type: r.p_type, sub_area: r.p_sub_area, art: r.p_art },
    display_name: r.display_name,
    overall_rating: r.overall_rating,
    ratings: Object.fromEntries(CATEGORIES.map(([k]) => [k, r[`rating_${k}`]]).filter(([, v]) => v != null)),
    title: r.title,
    body: r.body,
    review_type: r.review_type,
    stay_start: r.stay_start,
    stay_end: r.stay_end,
    currently_staying: bool(r.currently_staying),
    verified_resident: r.residency_verification === 'approved',
    helpful_count: r.helpful_count,
    themes: parseJson(r.themes, []),
    created_at: r.created_at,
    is_sample: r.data_source === 'demo_seed',
  }
}

const BASE = `SELECT r.*, p.slug AS p_slug, p.name AS p_name, p.type AS p_type, p.art AS p_art, s.name AS p_sub_area
  FROM reviews r JOIN properties p ON p.id = r.property_id JOIN sub_areas s ON s.id = p.sub_area_id JOIN areas a ON a.id = p.area_id
  WHERE r.moderation_status = 'approved' AND a.slug = ?`

const ORDER: Record<string, string> = {
  helpful: 'r.helpful_count DESC, r.created_at DESC',
  recent: 'r.created_at DESC',
  rating_low: 'r.overall_rating ASC, r.created_at DESC',
  rating_high: 'r.overall_rating DESC, r.created_at DESC',
}

export function listReviews(db: DB, opts: { slug?: string; type?: string; sort?: string; limit?: number }) {
  const params: unknown[] = [config.activeArea]
  let sql = BASE
  if (opts.slug) {
    sql += ' AND p.slug = ?'
    params.push(opts.slug)
  }
  if (opts.type && REVIEW_TYPES.includes(opts.type as ReviewType)) {
    sql += ' AND r.review_type = ?'
    params.push(opts.type)
  }
  const total = (db.prepare(`SELECT COUNT(*) AS n FROM (${sql})`).get(...params) as { n: number }).n
  sql += ` ORDER BY ${ORDER[opts.sort ?? 'helpful'] ?? ORDER.helpful} LIMIT ?`
  params.push(Math.min(100, opts.limit ?? 50))
  return { total, results: (db.prepare(sql).all(...params) as Row[]).map(toReview) }
}

export function createReview(db: DB, userId: string, displayName: string, input: NewReviewInput) {
  const p = db
    .prepare(`SELECT p.id FROM properties p JOIN areas a ON a.id = p.area_id WHERE p.slug = ? AND a.slug = ?`)
    .get(String(input.property_slug ?? ''), config.activeArea) as Row | undefined
  if (!p) throw notFound('We couldn’t find that place.')
  const overall = Number(input.overall_rating)
  if (!Number.isInteger(overall) || overall < 1 || overall > 5) throw badRequest('INVALID_RATING', 'Overall rating must be a whole number from 1 to 5.')
  const title = String(input.title ?? '').trim()
  const body = String(input.body ?? '').trim()
  if (title.length < 4 || title.length > 120) throw badRequest('INVALID_TITLE', 'Give your review a title between 4 and 120 characters.')
  if (body.length < 30 || body.length > 3000) throw badRequest('INVALID_BODY', 'Write at least 30 characters about your stay.')
  const type = REVIEW_TYPES.includes(input.review_type) ? input.review_type : 'general'
  const ratings: Record<string, number | null> = {}
  for (const [k] of CATEGORIES) {
    const v = input.ratings?.[k]
    ratings[k] = v == null ? null : Number(v)
    if (ratings[k] != null && (!Number.isInteger(ratings[k]) || ratings[k]! < 1 || ratings[k]! > 5)) {
      throw badRequest('INVALID_RATING', `${k} must be a whole number from 1 to 5.`)
    }
  }

  const residency = db.prepare('SELECT status FROM residency_verifications WHERE user_id = ? AND property_id = ?').get(userId, p.id) as Row | undefined
  const verified = residency?.status === 'approved'
  const now = nowIso()
  const id = `rev_${randomUUID().slice(0, 12)}`
  db.prepare(
    `INSERT INTO reviews (id, property_id, user_id, display_name, overall_rating, rating_cleanliness, rating_food_quality, rating_maintenance,
      rating_management, rating_privacy, rating_value_for_money, rating_security, title, body, review_type, stay_start, stay_end,
      currently_staying, residency_verification, moderation_status, helpful_count, report_count, themes, created_at, updated_at, data_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, '[]', ?, ?, 'user_submitted')`,
  ).run(
    id, p.id, userId, displayName, overall,
    ratings.cleanliness, ratings.food_quality, ratings.maintenance, ratings.management, ratings.privacy, ratings.value_for_money, ratings.security,
    title, body, type, input.stay_start ?? null, input.stay_end ?? null, input.currently_staying ? 1 : 0,
    verified ? 'approved' : residency?.status === 'pending' ? 'pending' : 'unverified',
    now, now,
  )
  return {
    id,
    moderation_status: 'pending' as const,
    verified_resident: verified,
    message: verified
      ? 'Thanks. Your review is in the moderation queue and will show the verified resident label once published.'
      : 'Thanks. Your review is in the moderation queue. It will be published as unverified unless you verify your stay at this place.',
  }
}

export function voteHelpful(db: DB, userId: string, reviewId: string) {
  const r = db.prepare(`SELECT id FROM reviews WHERE id = ? AND moderation_status = 'approved'`).get(reviewId)
  if (!r) throw notFound('Review not found.')
  const res = db
    .prepare(`INSERT OR IGNORE INTO review_votes (review_id, user_id, kind, created_at, updated_at, data_source) VALUES (?, ?, 'helpful', ?, ?, 'user_submitted')`)
    .run(reviewId, userId, nowIso(), nowIso())
  if (res.changes === 0) throw conflict('ALREADY_VOTED', 'You already marked this review as helpful.')
  db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(reviewId)
  return { helpful_count: (db.prepare('SELECT helpful_count FROM reviews WHERE id = ?').get(reviewId) as Row).helpful_count }
}

export function reportReview(db: DB, userId: string, reviewId: string, reason: string) {
  const r = db.prepare('SELECT id FROM reviews WHERE id = ?').get(reviewId)
  if (!r) throw notFound('Review not found.')
  const res = db
    .prepare(`INSERT OR IGNORE INTO review_votes (review_id, user_id, kind, reason, created_at, updated_at, data_source) VALUES (?, ?, 'report', ?, ?, ?, 'user_submitted')`)
    .run(reviewId, userId, String(reason ?? '').slice(0, 300) || null, nowIso(), nowIso())
  if (res.changes === 0) throw conflict('ALREADY_REPORTED', 'You already reported this review.')
  db.prepare('UPDATE reviews SET report_count = report_count + 1 WHERE id = ?').run(reviewId)
  const after = db.prepare('SELECT report_count FROM reviews WHERE id = ?').get(reviewId) as Row
  if (after.report_count >= AUTO_FLAG_REPORTS) {
    db.prepare(`UPDATE reviews SET moderation_status = 'flagged', moderation_note = 'Auto-flagged after repeated reports.' WHERE id = ? AND moderation_status = 'approved'`).run(reviewId)
  }
  return { reported: true, message: 'Thanks. A moderator will look at this review.' }
}
