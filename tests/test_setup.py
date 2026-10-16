import sys


def test_python_version():
    assert sys.version_info >= (3, 11)


def test_packages_import():
    import pydantic
    import dotenv  # noqa: F401

    assert int(pydantic.VERSION.split(".")[0]) >= 2
