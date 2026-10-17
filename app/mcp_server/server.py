"""Havenly MCP server.

This file only translates between MCP and the backend:
  AI client -> MCP tool call -> validate arguments -> backend search() -> structured result.
No search logic lives here.

Run locally:
  python -m app.mcp_server.server              (Streamable HTTP on http://127.0.0.1:8000/mcp)
  python -m app.mcp_server.server --stdio      (stdio, for clients that launch the server)
"""
import argparse
import json
from typing import Annotated, Literal

import anyio
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.types import ToolAnnotations
from pydantic import BaseModel, Field, ValidationError

from app.backend.errors import HavenlyError
from app.backend.models import FoodRequirements, SearchCriteria, SearchResponse
from app.backend.search_service import search

mcp = MCPServer(
    name="havenly",
    title="Havenly",
    version="0.1.0",
    instructions=(
        "Havenly helps women find PGs, hostels and shared rentals. Only state facts that appear in "
        "tool results. Always tell the user each fact's source (owner_listed, independently_verified, "
        "resident_reported, unknown), mention missing_information and conflicting_reports, and never "
        "say a place is safe. The current data is SYNTHETIC demo data."
    ),
)


class SoftPreferences(BaseModel):
    """How much the user cares about each quality, from 0 (not at all) to 1 (very much)."""
    quiet: float | None = Field(None, ge=0, le=1, description="Quiet environment (from resident noise reports)")
    privacy: float | None = Field(None, ge=0, le=1, description="Privacy (from resident privacy reports)")
    cleanliness: float | None = Field(None, ge=0, le=1)
    food_quality: float | None = Field(None, ge=0, le=1)
    value_for_money: float | None = Field(None, ge=0, le=1)
    commute_convenience: float | None = Field(None, ge=0, le=1, description="Accepted, but no commute data exists yet")


def _invalid_argument(exc: ValidationError) -> ToolError:
    problems = [f"{'.'.join(str(p) for p in e['loc']) or 'input'}: {e['msg']}" for e in exc.errors()]
    error = HavenlyError("INVALID_ARGUMENT", "Invalid search arguments.",
                         recovery="Fix the listed fields and call the tool again.", details={"problems": problems})
    return ToolError(json.dumps(error.to_dict()))


@mcp.tool(
    title="Search accommodations",
    annotations=ToolAnnotations(read_only_hint=True, destructive_hint=False, idempotent_hint=True,
                                open_world_hint=False),
)
async def search_properties(
    city: Annotated[str, Field(description="City, e.g. 'Kochi'. 'Ernakulam' and 'Cochin' map to Kochi.")],
    locality: Annotated[str | None, Field(description="Area within the city, e.g. 'Kakkanad'")] = None,
    max_rent: Annotated[int | None, Field(description="Monthly rent ceiling in rupees (hard filter)")] = None,
    min_rent: Annotated[int | None, Field(description="Monthly rent floor in rupees")] = None,
    accommodation_type: Literal["PG", "hostel", "shared_rental"] | None = None,
    room_type: Annotated[Literal["single", "double", "triple", "dormitory"] | None,
                         Field(description="Use 'single' when the user strongly wants privacy")] = None,
    women_only: Annotated[bool | None, Field(description="True = only places explicitly listed as women-only")] = None,
    required_amenities: Annotated[list[str] | None, Field(
        description="Must-have amenity codes: wifi, laundry, housekeeping, ac, hot_water, attached_bathroom, "
                    "study_table, power_backup, water_purifier, kitchen_access, parking, fridge, cctv, "
                    "security_guard, biometric_entry, gym")] = None,
    food_requirements: Annotated[FoodRequirements | None, Field(
        description="Cuisines like north_indian, south_indian, kerala. mandatory=true excludes places without them")] = None,
    soft_preferences: Annotated[SoftPreferences | None, Field(
        description="Qualities that RANK results but never exclude them")] = None,
    limit: Annotated[int, Field(ge=1, le=20, description="Max results (1-20)")] = 10,
) -> SearchResponse:
    """Search Havenly's accommodation database.

    Hard filters (city, rent, type, room type, women_only, required amenities, mandatory cuisine)
    exclude properties. Soft preferences only change the ranking, using resident review themes.
    Each result includes match_reasons, mismatches, missing_information, conflicting_reports,
    source labels (provenance) and verification status. monthly_rent is the cheapest room that
    satisfies the filters. Do not invent details that are not in the result.
    """
    try:
        criteria = SearchCriteria(
            city=city, locality=locality, max_rent=max_rent, min_rent=min_rent,
            accommodation_type=accommodation_type, room_type=room_type, women_only=women_only,
            required_amenities=required_amenities or [], food_requirements=food_requirements,
            soft_preferences=soft_preferences.model_dump(exclude_none=True) if soft_preferences else {},
            limit=limit,
        )
    except ValidationError as exc:
        raise _invalid_argument(exc) from exc

    try:
        # The backend uses a normal (blocking) database driver, so run it in a worker thread.
        return await anyio.to_thread.run_sync(search, criteria)
    except HavenlyError as exc:
        raise ToolError(json.dumps(exc.to_dict())) from exc


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Havenly MCP server")
    parser.add_argument("--stdio", action="store_true", help="Use stdio instead of Streamable HTTP")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.stdio:
        mcp.run("stdio")
    else:
        # 127.0.0.1 = only reachable from this computer. Never expose this publicly without auth.
        mcp.run("streamable-http", host="127.0.0.1", port=args.port)


if __name__ == "__main__":
    main()
