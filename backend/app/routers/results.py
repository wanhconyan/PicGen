from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import get_item, list_items, upsert_item
from app.services.event_log import add_event

router = APIRouter(prefix="/results", tags=["results"])


@router.get("")
def get_results(
    page: int = Query(default=1),
    page_size: int = Query(default=20),
    review_status: str | None = Query(default=None),
    character_id: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
):
    items = list_items("results")
    if review_status:
        items = [item for item in items if item.get("review_status") == review_status]
    if character_id:
        items = [item for item in items if item.get("character_id") == character_id]
    if keyword:
        q = keyword.lower()
        items = [
            item
            for item in items
            if q in str(item.get("id", "")).lower()
            or q in str(item.get("task_id", "")).lower()
            or q in str(item.get("metadata", {})).lower()
        ]
    items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
    return ok(paginate(items, page, page_size))


@router.get("/{result_id}")
def get_result(result_id: str):
    item = get_item("results", result_id)
    if not item:
        raise HTTPException(status_code=404, detail="Result not found")
    return ok(item)


@router.patch("/{result_id}")
def update_result(result_id: str, payload: dict = Body(default={})):
    item = get_item("results", result_id)
    if not item:
        raise HTTPException(status_code=404, detail="Result not found")
    item.update(deserialize_keys(payload))
    upsert_item("results", item)
    add_event("result.updated", "result", result_id, "Result updated")
    return ok(item)


@router.post("/{result_id}/set-preferred")
def set_preferred_result(result_id: str):
    item = get_item("results", result_id)
    if not item:
        raise HTTPException(status_code=404, detail="Result not found")

    character_id = item.get("character_id")
    outfit_id = item.get("outfit_id")

    for result in list_items("results"):
        if result.get("character_id") == character_id and result.get("outfit_id") == outfit_id:
            result["is_preferred"] = result.get("id") == result_id
            upsert_item("results", result)

    add_event("result.preferred_set", "result", result_id, "Result set as preferred")
    return ok(get_item("results", result_id))
