"""Database connection helper. Every part of Havenly gets connections from here."""
import os
import uuid

import psycopg
from dotenv import load_dotenv

load_dotenv()

# Fixed namespace so the same slug always produces the same property UUID.
PROPERTY_NAMESPACE = uuid.UUID("6f1c2a52-4f0e-4c55-9a3e-2b8f0d6a7c11")


def property_id_for(slug: str) -> uuid.UUID:
    """Stable property ID: re-seeding the database never changes a property's ID."""
    return uuid.uuid5(PROPERTY_NAMESPACE, slug)


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
    return url


def get_connection() -> psycopg.Connection:
    return psycopg.connect(get_database_url())
