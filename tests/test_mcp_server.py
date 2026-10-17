"""Phase 4 tests: call the MCP tool through a real MCP client (in-process, no network)."""
import asyncio
import json

import pytest
from mcp import Client

from app.db.connection import get_connection
from app.mcp_server.server import mcp


@pytest.fixture(scope="module", autouse=True)
def require_db():
    try:
        get_connection().close()
    except Exception as exc:
        pytest.skip(f"Database not reachable: {exc}")


async def _call(name, args):
    async with Client(mcp) as client:
        return await client.call_tool(name, args)


def call(name, args):
    return asyncio.run(_call(name, args))


def test_tool_is_discoverable():
    async def go():
        async with Client(mcp) as client:
            return await client.list_tools()
    tools = {t.name: t for t in asyncio.run(go()).tools}
    assert "search_properties" in tools
    schema = tools["search_properties"].input_schema
    assert "city" in schema["required"]
    assert tools["search_properties"].output_schema is not None  # structured output


def test_search_returns_real_database_records():
    result = call("search_properties", {"city": "Kochi", "max_rent": 9000, "women_only": True,
                                        "accommodation_type": "PG",
                                        "soft_preferences": {"quiet": 1, "privacy": 0.8}})
    assert not result.is_error
    data = result.structured_content
    assert data["total_matching"] == 10
    first = data["results"][0]
    assert first["name"] == "Lotus Residency Ladies PG"
    assert all(r["monthly_rent"] <= 9000 for r in data["results"])
    assert set(first["provenance"]) >= {"monthly_rent", "food", "amenities"}
    assert "missing_information" in first


def test_invalid_argument_is_structured_error():
    result = call("search_properties", {"city": "Kochi", "max_rent": -5})
    assert result.is_error
    text = result.content[0].text
    payload = json.loads(text[text.index("{"):])  # SDK prefixes "Error executing tool ...: "
    assert payload["error"]["code"] == "INVALID_ARGUMENT"
    assert any("max_rent" in p for p in payload["error"]["details"]["problems"])


def test_empty_city_is_rejected():
    result = call("search_properties", {"city": "  "})
    assert result.is_error
    assert "INVALID_ARGUMENT" in result.content[0].text


def test_no_results_is_not_an_error():
    result = call("search_properties", {"city": "Kochi", "max_rent": 1000})
    assert not result.is_error
    assert result.structured_content["results"] == []
    assert result.structured_content["search_metadata"]["suggestions"]
