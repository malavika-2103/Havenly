"""Input and output shapes for the search service (validated by Pydantic)."""
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

SourceType = Literal["owner_listed", "independently_verified", "resident_reported", "unknown"]

# Soft preferences we can actually evaluate, and which review theme feeds each one.
SOFT_PREFERENCE_THEMES = {
    "quiet": "noise",
    "privacy": "privacy",
    "cleanliness": "cleanliness",
    "food_quality": "food",
    "value_for_money": "value",
}
# Accepted in the input but no data exists yet, so they are reported as ignored.
SOFT_PREFERENCES_WITHOUT_DATA = {"commute_convenience"}

# Common alternative names for cities.
CITY_ALIASES = {"ernakulam": "kochi", "cochin": "kochi", "bangalore": "bengaluru"}

# Input size limits. They keep a single tool call from building a huge SQL query.
MAX_TEXT_LENGTH = 100
MAX_LIST_ITEMS = 20


def _clean_text(v: str) -> str:
    """Strip whitespace and reject control characters (e.g. NUL), which PostgreSQL cannot store."""
    v = v.strip()
    if any(ord(ch) < 32 or ord(ch) == 127 for ch in v):
        raise ValueError("must not contain control characters")
    return v


# ---------- input ----------

class FoodRequirements(BaseModel):
    cuisine: list[str] = Field(default_factory=list, max_length=MAX_LIST_ITEMS, description="e.g. ['north_indian']")
    mandatory: bool = Field(False, description="True = exclude places that don't list this cuisine")

    @field_validator("cuisine")
    @classmethod
    def normalise(cls, v: list[str]) -> list[str]:
        cleaned = [_clean_text(c).lower().replace(" ", "_").replace("-", "_") for c in v]
        if any(len(c) > MAX_TEXT_LENGTH for c in cleaned):
            raise ValueError(f"each cuisine must be at most {MAX_TEXT_LENGTH} characters")
        return list(dict.fromkeys(c for c in cleaned if c))  # drop blanks and duplicates


class SearchCriteria(BaseModel):
    city: str = Field(..., max_length=MAX_TEXT_LENGTH,
                      description="City name, e.g. 'Kochi' (Ernakulam and Cochin also accepted)")
    locality: str | None = Field(None, max_length=MAX_TEXT_LENGTH)
    min_rent: int | None = Field(None, ge=0)
    max_rent: int | None = Field(None, ge=0, description="Monthly rent ceiling in rupees")
    accommodation_type: Literal["PG", "hostel", "shared_rental"] | None = None
    room_type: Literal["single", "double", "triple", "dormitory"] | None = None
    women_only: bool | None = Field(None, description="True = only places explicitly listed as women-only")
    required_amenities: list[str] = Field(default_factory=list, max_length=MAX_LIST_ITEMS)
    food_requirements: FoodRequirements | None = None
    soft_preferences: dict[str, float] = Field(default_factory=dict, max_length=MAX_LIST_ITEMS,
                                               description="Weights 0-1, e.g. {'quiet': 1}")
    limit: int = Field(10, ge=1, le=20)

    @field_validator("city")
    @classmethod
    def city_not_empty(cls, v: str) -> str:
        v = _clean_text(v)
        if not v:
            raise ValueError("city is required")
        return v

    @field_validator("locality")
    @classmethod
    def clean_locality(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return _clean_text(v) or None

    @field_validator("required_amenities")
    @classmethod
    def clean_amenities(cls, v: list[str]) -> list[str]:
        cleaned = [_clean_text(a).lower() for a in v]
        if any(len(a) > MAX_TEXT_LENGTH for a in cleaned):
            raise ValueError(f"each amenity must be at most {MAX_TEXT_LENGTH} characters")
        return list(dict.fromkeys(a for a in cleaned if a))  # drop blanks and duplicates

    @field_validator("soft_preferences")
    @classmethod
    def weights_in_range(cls, v: dict[str, float]) -> dict[str, float]:
        for name, weight in v.items():
            if len(name) > MAX_TEXT_LENGTH:
                raise ValueError(f"soft preference names must be at most {MAX_TEXT_LENGTH} characters")
            if not 0 <= weight <= 1:
                raise ValueError(f"soft preference '{name}' must be between 0 and 1")
        return {k.strip().lower(): w for k, w in v.items()}

    @model_validator(mode="after")
    def rent_range_valid(self):
        if self.min_rent is not None and self.max_rent is not None and self.min_rent > self.max_rent:
            raise ValueError("min_rent cannot be greater than max_rent")
        return self


# ---------- output ----------

class Location(BaseModel):
    city: str
    locality: str | None


class AdditionalCost(BaseModel):
    label: str
    amount: int | None
    frequency: str
    source_type: SourceType


class ReviewSummary(BaseModel):
    average_rating: float | None
    review_count: int
    verified_resident_count: int


class SearchResult(BaseModel):
    property_id: str
    name: str
    location: Location
    property_type: str
    monthly_rent: int
    room_type: str
    deposit: int | None
    additional_costs: list[AdditionalCost]
    score: float | None
    match_reasons: list[str]
    mismatches: list[str]
    missing_information: list[str]
    conflicting_reports: list[str]
    provenance: dict[str, SourceType]
    verification_status: Literal["verified", "partially_verified", "unverified"]
    verified_scopes: list[str]
    review_summary: ReviewSummary
    is_synthetic: bool


class SearchMetadata(BaseModel):
    hard_filters_applied: list[str]
    soft_preferences_evaluated: list[str]
    unsupported_preferences_ignored: list[str]
    excluded_because_unknown: list[str] = []
    suggestions: list[str] = []


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total_matching: int
    search_metadata: SearchMetadata
