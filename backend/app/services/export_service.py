from __future__ import annotations

from typing import Any

from app.core.storage import get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event


def create_export(result_id: str, output_path: str = "exports", file_name: str | None = None) -> dict[str, Any]:
    result = get_item("results", result_id)
    if not result:
        raise ValueError("Result not found")
    if result.get("review_status") != "approved":
        raise ValueError("Result must be approved before export")

    export = {
        "id": new_id("export"),
        "result_id": result_id,
        "status": "success",
        "path": output_path,
        "file_name": file_name or f"{result_id}.png",
        "created_at": now_iso(),
    }
    upsert_item("exports", export)
    add_event("export.created", "result", result_id, "Result exported", {"export_id": export["id"]})
    return export


def list_exports() -> list[dict[str, Any]]:
    return sorted(list_items("exports"), key=lambda x: x.get("created_at", ""), reverse=True)


def batch_export(result_ids: list[str], output_path: str = "exports") -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for result_id in result_ids:
        try:
            out.append(create_export(result_id, output_path=output_path))
        except ValueError:
            continue
    return out
