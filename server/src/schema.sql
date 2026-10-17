-- Havenly schema. Written to stay portable to Postgres/PostGIS:
--   ids are TEXT, timestamps are ISO-8601 TEXT, booleans are INTEGER 0/1, JSON is TEXT.
--   lat/lng become a geography(Point) column on Postgres; everything else maps 1:1.
-- Every table carries created_at, updated_at and data_source.
--   data_source: 'demo_seed' (pitch data), 'manual_verified' (production entry),
--                'user_submitted' (created by a signed-in user at runtime).

PRAGMA foreign_keys = ON;

-- ---------- geography ----------

CREATE TABLE IF NOT EXISTS areas (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  district    TEXT NOT NULL,
  state       TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('active', 'coming_soon')),
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);

CREATE TABLE IF NOT EXISTS sub_areas (
  id          TEXT PRIMARY KEY,
  area_id     TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (area_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_sub_areas_area ON sub_areas(area_id);

CREATE TABLE IF NOT EXISTS landmarks (
  id          TEXT PRIMARY KEY,
  area_id     TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('it_park', 'campus', 'government', 'transit', 'hospital', 'market')),
  aliases     TEXT NOT NULL DEFAULT '[]',  -- JSON: other names people type, used by search interpretation
  display_order INTEGER NOT NULL DEFAULT 100, -- lower shows first in examples, filters and questions
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (area_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_landmarks_area ON landmarks(area_id);

-- ---------- properties ----------

CREATE TABLE IF NOT EXISTS properties (
  id                  TEXT PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('PG', 'Hostel', 'Shared Rental')),
  gender_policy       TEXT NOT NULL CHECK (gender_policy IN ('women_only', 'men_only', 'mixed')),
  occupant_focus      TEXT NOT NULL CHECK (occupant_focus IN ('working_professionals', 'students', 'both')),
  area_id             TEXT NOT NULL REFERENCES areas(id),
  sub_area_id         TEXT NOT NULL REFERENCES sub_areas(id),
  address_line        TEXT NOT NULL,
  lat                 REAL NOT NULL,
  lng                 REAL NOT NULL,
  description         TEXT NOT NULL,
  year_established    INTEGER,
  floors              INTEGER,
  rent_min            INTEGER NOT NULL CHECK (rent_min > 0),
  rent_max            INTEGER NOT NULL CHECK (rent_max >= rent_min),
  security_deposit    INTEGER NOT NULL CHECK (security_deposit >= 0),
  advance_months      INTEGER NOT NULL DEFAULT 1 CHECK (advance_months >= 0),
  notice_period_days  INTEGER NOT NULL DEFAULT 30,
  notice_terms        TEXT,
  min_stay_months     INTEGER NOT NULL DEFAULT 1 CHECK (min_stay_months >= 1),
  max_stay_months     INTEGER NOT NULL DEFAULT 24,
  maintenance_charge  INTEGER NOT NULL DEFAULT 0,
  electricity_policy  TEXT NOT NULL CHECK (electricity_policy IN ('included', 'metered', 'fixed_fee')),
  other_charges       TEXT NOT NULL DEFAULT '[]',  -- JSON [{name, amount, frequency: monthly|one_time|yearly, refundable}]
  art                 TEXT NOT NULL DEFAULT 'building', -- illustration key until real photos exist
  last_verified_at    TEXT,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('not_verified', 'partially_verified', 'verified')),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  data_source         TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  CHECK (max_stay_months >= min_stay_months)
);
CREATE INDEX IF NOT EXISTS idx_properties_area ON properties(area_id);
CREATE INDEX IF NOT EXISTS idx_properties_sub_area ON properties(sub_area_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_gender ON properties(gender_policy);
CREATE INDEX IF NOT EXISTS idx_properties_focus ON properties(occupant_focus);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent_min, rent_max);
CREATE INDEX IF NOT EXISTS idx_properties_verification ON properties(verification_status, last_verified_at);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(data_source);

CREATE TABLE IF NOT EXISTS room_inventory (
  id                      TEXT PRIMARY KEY,
  property_id             TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type               TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'dorm')),
  occupancy               INTEGER NOT NULL CHECK (occupancy BETWEEN 1 AND 8),
  ac                      INTEGER NOT NULL DEFAULT 0,
  attached_bathroom       INTEGER NOT NULL DEFAULT 0,
  furnished               INTEGER NOT NULL DEFAULT 1,
  rent_per_bed            INTEGER NOT NULL CHECK (rent_per_bed > 0),
  mess_cost_per_month     INTEGER,             -- NULL: no optional mess (meals included, or no food)
  total_beds              INTEGER NOT NULL CHECK (total_beds > 0),
  available_beds          INTEGER NOT NULL CHECK (available_beds >= 0),
  next_available_date     TEXT,
  availability_updated_at TEXT NOT NULL,       -- "as last updated by the listing", never live
  waitlist_open           INTEGER NOT NULL DEFAULT 0,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL,
  data_source             TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (property_id, room_type),
  CHECK (available_beds <= total_beds)
);
CREATE INDEX IF NOT EXISTS idx_rooms_property ON room_inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON room_inventory(room_type, occupancy);
CREATE INDEX IF NOT EXISTS idx_rooms_rent ON room_inventory(rent_per_bed);
CREATE INDEX IF NOT EXISTS idx_rooms_flags ON room_inventory(ac, attached_bathroom, available_beds);

CREATE TABLE IF NOT EXISTS amenities (
  id          TEXT PRIMARY KEY,   -- wifi, ac, laundry, ...
  label       TEXT NOT NULL,
  icon        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);

CREATE TABLE IF NOT EXISTS property_amenities (
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id  TEXT NOT NULL REFERENCES amenities(id),
  note        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  PRIMARY KEY (property_id, amenity_id)
);
CREATE INDEX IF NOT EXISTS idx_property_amenities_amenity ON property_amenities(amenity_id);

CREATE TABLE IF NOT EXISTS wifi_details (
  property_id       TEXT PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  free              INTEGER NOT NULL,
  speed_mbps        INTEGER NOT NULL CHECK (speed_mbps > 0),
  backup_connection INTEGER NOT NULL DEFAULT 0,
  coverage          TEXT NOT NULL CHECK (coverage IN ('rooms', 'common_areas', 'rooms_and_common_areas')),
  data_cap_gb       INTEGER,  -- NULL = unlimited
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  data_source       TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_wifi_filters ON wifi_details(free, speed_mbps);

CREATE TABLE IF NOT EXISTS food_details (
  property_id          TEXT PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  food_included        TEXT NOT NULL CHECK (food_included IN ('included', 'optional', 'none')),
  meals_per_day        INTEGER NOT NULL DEFAULT 0,
  meal_types           TEXT NOT NULL DEFAULT '[]',  -- JSON ["breakfast","lunch","dinner","evening_snack"]
  veg_options          TEXT CHECK (veg_options IN ('veg_only', 'non_veg_allowed', 'both')),
  cuisine_tags         TEXT NOT NULL DEFAULT '[]',  -- JSON subset of kerala|north_indian|south_indian|mixed
  mess_timing          TEXT,
  common_kitchen_hours TEXT,
  self_cooking_allowed INTEGER NOT NULL DEFAULT 0,
  food_quality_note    TEXT,                        -- owner-listed description, never a rating
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  data_source          TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_food_filters ON food_details(food_included, veg_options);

CREATE TABLE IF NOT EXISTS cleaning_details (
  property_id                   TEXT PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  room_cleaning_per_week        INTEGER NOT NULL CHECK (room_cleaning_per_week BETWEEN 0 AND 7),
  bathroom_cleaning_per_week    INTEGER NOT NULL CHECK (bathroom_cleaning_per_week BETWEEN 0 AND 14),
  common_area_cleaning_per_week INTEGER NOT NULL CHECK (common_area_cleaning_per_week BETWEEN 0 AND 14),
  linen_change_per_month        INTEGER NOT NULL DEFAULT 0,
  pest_control_per_year         INTEGER NOT NULL DEFAULT 0,
  garbage_collection            TEXT NOT NULL CHECK (garbage_collection IN ('daily', 'alternate_days', 'twice_weekly', 'weekly')),
  created_at                    TEXT NOT NULL,
  updated_at                    TEXT NOT NULL,
  data_source                   TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_cleaning_room ON cleaning_details(room_cleaning_per_week);

CREATE TABLE IF NOT EXISTS rules_details (
  property_id            TEXT PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  gate_close_time        TEXT,  -- 'HH:MM' 24h; NULL = gate never closes
  curfew_type            TEXT NOT NULL CHECK (curfew_type IN ('none', 'flexible', 'fixed')),
  late_entry_policy      TEXT NOT NULL CHECK (late_entry_policy IN ('none', 'with_permission', 'flexible')),
  out_pass_required      INTEGER NOT NULL DEFAULT 0,
  visitors_policy        TEXT NOT NULL CHECK (visitors_policy IN ('not_allowed', 'reception_only', 'daytime_only', 'with_notice')),
  visitor_hours          TEXT,
  smoking_alcohol_policy TEXT NOT NULL,
  overnight_guests       INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  data_source            TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_rules_curfew ON rules_details(curfew_type, gate_close_time);
CREATE INDEX IF NOT EXISTS idx_rules_entry ON rules_details(late_entry_policy, visitors_policy);

-- Factual safety features only. There is deliberately no combined "safety score".
CREATE TABLE IF NOT EXISTS safety_features (
  property_id                 TEXT PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  cctv                        TEXT NOT NULL CHECK (cctv IN ('none', 'entrance_only', 'common_areas', 'extensive')),
  security_guard              TEXT NOT NULL CHECK (security_guard IN ('none', 'night_only', '24x7')),
  biometric_or_keycard_entry  INTEGER NOT NULL DEFAULT 0,
  female_warden_resident      INTEGER NOT NULL DEFAULT 0,
  female_staff_only           INTEGER NOT NULL DEFAULT 0,
  fire_extinguishers          INTEGER NOT NULL DEFAULT 0,
  first_aid                   INTEGER NOT NULL DEFAULT 0,
  distance_to_main_road_m     INTEGER NOT NULL,
  approach_road_lit           INTEGER NOT NULL DEFAULT 0,
  night_transport_nearby      INTEGER NOT NULL DEFAULT 0,
  emergency_contact_displayed INTEGER NOT NULL DEFAULT 0,
  created_at                  TEXT NOT NULL,
  updated_at                  TEXT NOT NULL,
  data_source                 TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_safety_filters ON safety_features(cctv, security_guard, female_warden_resident, biometric_or_keycard_entry);
CREATE INDEX IF NOT EXISTS idx_safety_road ON safety_features(distance_to_main_road_m);

CREATE TABLE IF NOT EXISTS commute (
  property_id  TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  landmark_id  TEXT NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
  minutes_walk INTEGER NOT NULL,
  minutes_auto INTEGER NOT NULL,
  minutes_bus  INTEGER NOT NULL,
  distance_km  REAL NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  data_source  TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  PRIMARY KEY (property_id, landmark_id)
);
CREATE INDEX IF NOT EXISTS idx_commute_landmark ON commute(landmark_id, minutes_auto);

-- One or more rows per displayed fact. Powers "listed by owner" / "verified by Havenly" / "reported by residents".
CREATE TABLE IF NOT EXISTS fact_provenance (
  id            TEXT PRIMARY KEY,
  property_id   TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  field_name    TEXT NOT NULL,  -- e.g. 'rules.gate_close_time', 'safety.cctv'
  source        TEXT NOT NULL CHECK (source IN ('owner_listed', 'platform_verified', 'resident_reported')),
  evidence_type TEXT,           -- site_visit, photo, document, owner_form, review_pattern
  verified_at   TEXT,
  verified_by   TEXT,
  note          TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  data_source   TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_provenance_property ON fact_provenance(property_id, field_name);
CREATE INDEX IF NOT EXISTS idx_provenance_source ON fact_provenance(source);

-- Always phrased as resident reports, never as verdicts.
CREATE TABLE IF NOT EXISTS reported_differences (
  id                    TEXT PRIMARY KEY,
  property_id           TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  field_name            TEXT NOT NULL,
  title                 TEXT NOT NULL,
  listed_value          TEXT NOT NULL,
  reported_summary      TEXT NOT NULL,
  supporting_review_ids TEXT NOT NULL,  -- JSON array, at least 2
  status                TEXT NOT NULL CHECK (status IN ('active', 'owner_responded', 'resolved')),
  owner_response        TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL,
  data_source           TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_differences_property ON reported_differences(property_id, status);

-- ADMIN-ONLY. Never selected by any public query.
CREATE TABLE IF NOT EXISTS owners (
  id          TEXT PRIMARY KEY,
  property_id TEXT NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  owner_name  TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);

-- ---------- people ----------

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  phone        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  data_source  TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);

CREATE TABLE IF NOT EXISTS saved_properties (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  PRIMARY KEY (user_id, property_id)
);

-- A request never reserves a bed. Beds are only decremented when the owner accepts.
CREATE TABLE IF NOT EXISTS booking_requests (
  id                TEXT PRIMARY KEY,
  reference         TEXT NOT NULL UNIQUE,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id       TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type         TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'dorm')),
  occupancy         INTEGER NOT NULL,
  move_in_date      TEXT NOT NULL,
  duration_months   INTEGER NOT NULL,
  include_mess      INTEGER NOT NULL DEFAULT 0,
  estimate_snapshot TEXT NOT NULL,  -- JSON of the itemised estimate at request time
  status            TEXT NOT NULL CHECK (status IN ('submitted', 'owner_notified', 'accepted', 'declined', 'expired', 'cancelled_by_user')),
  status_history    TEXT NOT NULL,  -- JSON [{status, at, by, note}]
  note_from_user    TEXT,
  idempotency_key   TEXT,
  expires_at        TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  data_source       TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON booking_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON booking_requests(property_id, room_type, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON booking_requests(status, created_at);

CREATE TABLE IF NOT EXISTS room_waitlist (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type   TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (user_id, property_id, room_type)
);

CREATE TABLE IF NOT EXISTS reviews (
  id                     TEXT PRIMARY KEY,
  property_id            TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id                TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name           TEXT NOT NULL,
  overall_rating         INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  rating_cleanliness     INTEGER CHECK (rating_cleanliness BETWEEN 1 AND 5),
  rating_food_quality    INTEGER CHECK (rating_food_quality BETWEEN 1 AND 5),
  rating_maintenance     INTEGER CHECK (rating_maintenance BETWEEN 1 AND 5),
  rating_management      INTEGER CHECK (rating_management BETWEEN 1 AND 5),
  rating_privacy         INTEGER CHECK (rating_privacy BETWEEN 1 AND 5),
  rating_value_for_money INTEGER CHECK (rating_value_for_money BETWEEN 1 AND 5),
  rating_security        INTEGER CHECK (rating_security BETWEEN 1 AND 5),
  title                  TEXT NOT NULL,
  body                   TEXT NOT NULL,
  review_type            TEXT NOT NULL CHECK (review_type IN ('general', 'tip', 'expectation_vs_reality', 'hidden_cost', 'rule_experience', 'safety_report')),
  stay_start             TEXT,
  stay_end               TEXT,
  currently_staying      INTEGER NOT NULL DEFAULT 0,
  residency_verification TEXT NOT NULL CHECK (residency_verification IN ('unverified', 'pending', 'approved')),
  moderation_status      TEXT NOT NULL CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_note        TEXT,
  helpful_count          INTEGER NOT NULL DEFAULT 0,
  report_count           INTEGER NOT NULL DEFAULT 0,
  themes                 TEXT NOT NULL DEFAULT '[]',  -- JSON array
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  data_source            TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON reviews(moderation_status, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- One helpful vote per user per review.
CREATE TABLE IF NOT EXISTS review_votes (
  review_id   TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('helpful', 'report')),
  reason      TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  PRIMARY KEY (review_id, user_id, kind)
);

-- Evidence files are never public; only the status is ever exposed.
CREATE TABLE IF NOT EXISTS residency_verifications (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id   TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('rent_receipt', 'rental_agreement', 'payment_record', 'id_card')),
  status        TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   TEXT,
  reviewed_at   TEXT,
  note          TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  data_source   TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (user_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_residency_status ON residency_verifications(status);

CREATE TABLE IF NOT EXISTS area_waitlist (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  area_slug   TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('demo_seed', 'manual_verified', 'user_submitted')),
  UNIQUE (email, area_slug)
);

-- ---------- read model for search ----------
-- Flattens one property into one row so every filter is a plain WHERE clause.
-- Only approved reviews count towards ratings.
DROP VIEW IF EXISTS property_search;
CREATE VIEW property_search AS
SELECT
  p.*,
  a.slug  AS area_slug,
  a.name  AS area_name,
  s.slug  AS sub_area_slug,
  s.name  AS sub_area_name,
  w.free  AS wifi_free, w.speed_mbps AS wifi_speed_mbps, w.data_cap_gb AS wifi_data_cap_gb,
  f.food_included, f.veg_options, f.cuisine_tags, f.meals_per_day,
  c.room_cleaning_per_week, c.garbage_collection,
  r.curfew_type, r.gate_close_time, r.late_entry_policy, r.visitors_policy,
  sf.cctv, sf.security_guard, sf.female_warden_resident, sf.biometric_or_keycard_entry, sf.distance_to_main_road_m,
  (SELECT COUNT(*) FROM reviews rv WHERE rv.property_id = p.id AND rv.moderation_status = 'approved') AS review_count,
  (SELECT ROUND(AVG(rv.overall_rating), 2) FROM reviews rv WHERE rv.property_id = p.id AND rv.moderation_status = 'approved') AS avg_rating,
  (SELECT MIN(ri.rent_per_bed) FROM room_inventory ri WHERE ri.property_id = p.id) AS from_rent,
  (SELECT COALESCE(SUM(ri.available_beds), 0) FROM room_inventory ri WHERE ri.property_id = p.id) AS beds_available,
  (SELECT COUNT(*) FROM fact_provenance fp WHERE fp.property_id = p.id AND fp.source = 'platform_verified') AS verified_fact_count
FROM properties p
JOIN areas a ON a.id = p.area_id
JOIN sub_areas s ON s.id = p.sub_area_id
LEFT JOIN wifi_details w ON w.property_id = p.id
LEFT JOIN food_details f ON f.property_id = p.id
LEFT JOIN cleaning_details c ON c.property_id = p.id
LEFT JOIN rules_details r ON r.property_id = p.id
LEFT JOIN safety_features sf ON sf.property_id = p.id;

-- Web Push subscriptions: one row per browser/device a signed-in user turned notifications on for.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions (user_id);
