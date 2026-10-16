"""Phase 1 check: confirms Python, the virtual environment and packages work."""
import os
import sys


def main() -> None:
    print(f"Python version : {sys.version.split()[0]}")
    in_venv = sys.prefix != sys.base_prefix
    print(f"Virtual env    : {'ACTIVE' if in_venv else 'NOT ACTIVE (activate .venv first)'}")

    if sys.version_info < (3, 11):
        print("FAIL: Python 3.11 or newer is required.")
        sys.exit(1)

    try:
        import pydantic
        import dotenv  # noqa: F401
        import pytest  # noqa: F401
    except ImportError as exc:
        print(f"FAIL: missing package -> {exc.name}. Run: pip install -r requirements.txt")
        sys.exit(1)

    print(f"Pydantic       : {pydantic.VERSION}")

    from dotenv import load_dotenv
    load_dotenv()
    env = os.getenv("APP_ENV")
    print(f".env loaded    : {'yes (APP_ENV=' + env + ')' if env else 'no .env file yet (copy .env.example)'}")

    print("\nOK: Havenly Phase 1 setup works.")


if __name__ == "__main__":
    main()
