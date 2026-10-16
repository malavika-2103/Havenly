"""Structured errors shared by the backend and (later) the MCP server."""


class HavenlyError(Exception):
    """An error with a stable code that tools and clients can react to."""

    def __init__(self, code: str, message: str, recovery: str | None = None, details: dict | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.recovery = recovery
        self.details = details or {}

    def to_dict(self) -> dict:
        return {"error": {"code": self.code, "message": self.message,
                          "recovery": self.recovery, "details": self.details}}
