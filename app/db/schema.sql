-- Havenly database schema (Phase 2)
-- Running this file RESETS the database: it drops and recreates every table.

DROP TABLE IF EXISTS review_themes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS property_verifications CASCADE;
DROP TABLE IF EXISTS accommodation_rules CASCADE;
DROP TABLE IF EXISTS food_arrangements CASCADE;
DROP TABLE IF EXISTS property_amenities CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS additional_costs CASCADE;
DROP TABLE IF EXISTS room_options CASCADE;
DROP TABLE IF EXISTS property_locations CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TYPE IF EXISTS source_type CASCADE;

-- Where a fact came from. Every important fact carries one of these.
CREATE TYPE source_type AS ENUM (
    'owner_listed',            -- the property owner claims it
    'independently_verified',  -- Havenly checked it
    'resident_reported',       -- residents said it in reviews
    'unknown'                  -- nobody has told us
);

-- 1. One row per accommodation.
CREATE TABLE properties (
    id                UUID PRIMARY KEY,               -- stable ID used by MCP tools
    slug              TEXT NOT NULL UNIQUE,           -- human-readable key, e.g. kochi-lotus-pg
    name              TEXT NOT NULL,
    property_type     TEXT NOT NULL CHECK (property_type IN ('PG', 'hostel', 'shared_rental')),
    women_only        BOOLEAN,                        -- NULL = unknown
    women_only_source source_type NOT NULL DEFAULT 'unknown',
    description       TEXT,
    is_synthetic      BOOLEAN NOT NULL DEFAULT TRUE,  -- demo data, not a real place
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Where it is (one location per property).
CREATE TABLE property_locations (
    property_id UUID PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
    city        TEXT NOT NULL,
    locality    TEXT,
    latitude    NUMERIC(9, 6),
    longitude   NUMERIC(9, 6),
    source_type source_type NOT NULL DEFAULT 'owner_listed'
);

-- 3. Room types and prices (a property can offer several).
CREATE TABLE room_options (
    id             SERIAL PRIMARY KEY,
    property_id    UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_type      TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'dormitory')),
    monthly_rent   INTEGER NOT NULL CHECK (monthly_rent >= 0),
    rent_source    source_type NOT NULL DEFAULT 'owner_listed',
    deposit        INTEGER CHECK (deposit >= 0),      -- NULL = unknown
    deposit_source source_type NOT NULL DEFAULT 'unknown',
    UNIQUE (property_id, room_type)
);

-- 4. Extra charges beyond rent (electricity, maintenance, ...).
CREATE TABLE additional_costs (
    id          SERIAL PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    amount      INTEGER,                              -- NULL = amount unknown
    frequency   TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'one_time', 'usage_based')),
    source_type source_type NOT NULL DEFAULT 'owner_listed'
);

-- 5. Catalogue of amenities, then which property has which.
CREATE TABLE amenities (
    code     TEXT PRIMARY KEY,                        -- e.g. 'wifi'
    name     TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE property_amenities (
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_code TEXT NOT NULL REFERENCES amenities(code),
    available    BOOLEAN NOT NULL,                    -- FALSE = explicitly not available
    source_type  source_type NOT NULL DEFAULT 'owner_listed',
    PRIMARY KEY (property_id, amenity_code)
);

-- 6. Food: one row per cuisine offered.
CREATE TABLE food_arrangements (
    id            SERIAL PRIMARY KEY,
    property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    cuisine       TEXT NOT NULL,                      -- e.g. 'north_indian', 'kerala'
    meals_per_day INTEGER CHECK (meals_per_day BETWEEN 0 AND 4),
    vegetarian_only BOOLEAN,                          -- NULL = unknown
    source_type   source_type NOT NULL DEFAULT 'owner_listed',
    UNIQUE (property_id, cuisine)
);

-- 7. House rules. A missing rule_type for a property = unknown.
CREATE TABLE accommodation_rules (
    id          SERIAL PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rule_type   TEXT NOT NULL CHECK (rule_type IN ('curfew', 'visitors', 'overnight_guests', 'cooking', 'smoking_alcohol')),
    value       TEXT NOT NULL,
    source_type source_type NOT NULL DEFAULT 'owner_listed',
    UNIQUE (property_id, rule_type)
);

-- 8. What Havenly has checked. Verification is NOT proof of safety.
CREATE TABLE property_verifications (
    id           SERIAL PRIMARY KEY,
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    scope        TEXT NOT NULL CHECK (scope IN ('existence', 'rent', 'amenities', 'food', 'rules')),
    verified_by  TEXT NOT NULL,
    verified_at  DATE NOT NULL,
    expires_at   DATE,
    evidence_ref TEXT,                                -- PRIVATE: never returned by MCP tools
    UNIQUE (property_id, scope)
);

-- 9. Resident reviews.
CREATE TABLE reviews (
    id                   SERIAL PRIMARY KEY,
    property_id          UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reviewer_label       TEXT NOT NULL,               -- display name only, no user accounts yet
    is_verified_resident BOOLEAN NOT NULL DEFAULT FALSE,
    rating               SMALLINT CHECK (rating BETWEEN 1 AND 5),
    review_text          TEXT NOT NULL,
    created_at           DATE NOT NULL
);

-- 10. What each review talks about, and whether positively or negatively.
CREATE TABLE review_themes (
    review_id  INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    theme      TEXT NOT NULL CHECK (theme IN ('food', 'privacy', 'noise', 'cleanliness', 'safety', 'maintenance', 'management', 'value')),
    sentiment  SMALLINT NOT NULL CHECK (sentiment IN (-1, 0, 1)),  -- -1 negative, 0 mixed, 1 positive
    confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.00,                -- how sure the tagging is (0-1)
    PRIMARY KEY (review_id, theme)
);

-- Indexes for the columns search filters on.
CREATE INDEX idx_locations_city ON property_locations (lower(city));
CREATE INDEX idx_rooms_rent ON room_options (monthly_rent);
CREATE INDEX idx_reviews_property ON reviews (property_id);
