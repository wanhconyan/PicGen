from __future__ import annotations

import re
from typing import Any


_FIRST_CAP_RE = re.compile("(.)([A-Z][a-z]+)")
_ALL_CAP_RE = re.compile("([a-z0-9])([A-Z])")


def to_snake(name: str) -> str:
    step1 = _FIRST_CAP_RE.sub(r"\1_\2", name)
    return _ALL_CAP_RE.sub(r"\1_\2", step1).lower()


def to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def deserialize_keys(value: Any) -> Any:
    if isinstance(value, list):
        return [deserialize_keys(item) for item in value]
    if isinstance(value, dict):
        return {to_snake(key): deserialize_keys(item) for key, item in value.items()}
    return value


def serialize_keys(value: Any) -> Any:
    if isinstance(value, list):
        return [serialize_keys(item) for item in value]
    if isinstance(value, dict):
        return {to_camel(key): serialize_keys(item) for key, item in value.items()}
    return value


def ok(data: Any) -> dict[str, Any]:
    return {"ok": True, "data": serialize_keys(data)}
