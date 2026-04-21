from __future__ import annotations

from typing import Any

from app.core.storage import list_items, upsert_item
from app.core.utils import new_id, now_iso


def add_event(event_type: str, target_type: str, target_id: str, message: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    item = {
        "id": new_id("log"),
        "event_type": event_type,
        "target_type": target_type,
        "target_id": target_id,
        "message": message,
        "metadata": metadata or {},
        "created_at": now_iso(),
    }
    return upsert_item("event_logs", item)


def list_events() -> list[dict[str, Any]]:
    return sorted(list_items("event_logs"), key=lambda x: x.get("created_at", ""), reverse=True)
