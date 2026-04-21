from __future__ import annotations

from typing import Any

from app.core.storage import get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event


def create_review(result_id: str, decision: str, comment: str = "", scores: dict[str, Any] | None = None) -> dict[str, Any]:
    result = get_item("results", result_id)
    if not result:
        raise ValueError("Result not found")

    review = {
        "id": new_id("review"),
        "result_id": result_id,
        "decision": decision,
        "comment": comment,
        "scores": scores or {},
        "created_at": now_iso(),
    }
    upsert_item("reviews", review)

    result["review_status"] = "approved" if decision == "approve" else "rejected"
    result["score"] = _avg_score(scores or {})
    upsert_item("results", result)

    add_event("review.created", "result", result_id, f"Review decision: {decision}", {"review_id": review["id"]})
    return review


def _avg_score(scores: dict[str, Any]) -> float | None:
    values = [float(v) for v in scores.values() if isinstance(v, (int, float))]
    if not values:
        return None
    return round(sum(values) / len(values), 2)


def promote_result_to_base(result_id: str) -> dict[str, Any]:
    result = get_item("results", result_id)
    if not result:
        raise ValueError("Result not found")

    character_id = result.get("character_id")
    for item in list_items("base_images"):
        if item.get("character_id") == character_id and item.get("is_primary"):
            item["is_primary"] = False
            upsert_item("base_images", item)

    base = {
        "id": new_id("base"),
        "character_id": character_id,
        "result_id": result_id,
        "image_url": result.get("image_url"),
        "is_primary": True,
        "created_at": now_iso(),
    }
    upsert_item("base_images", base)
    add_event("result.promoted_to_base", "result", result_id, "Promoted to base image", {"base_image_id": base["id"]})
    return base


def list_reviews() -> list[dict[str, Any]]:
    return sorted(list_items("reviews"), key=lambda x: x.get("created_at", ""), reverse=True)
