from __future__ import annotations

from math import ceil
from typing import Any


def to_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def paginate(items: list[dict], page: int, page_size: int) -> dict:
    safe_page = max(page, 1)
    safe_page_size = max(min(page_size, 100), 1)
    total = len(items)
    total_pages = ceil(total / safe_page_size) if total else 1
    start = (safe_page - 1) * safe_page_size
    end = start + safe_page_size
    return {
        "items": items[start:end],
        "pagination": {
            "page": safe_page,
            "page_size": safe_page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }
