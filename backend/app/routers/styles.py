from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import delete_item, get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event

router = APIRouter(prefix="/styles", tags=["styles"])


@router.get("")
def list_styles(page: int = Query(default=1), page_size: int = Query(default=20), keyword: str | None = Query(default=None)):
    items = list_items("styles")
    if keyword:
        q = keyword.lower()
        items = [item for item in items if q in item.get("name", "").lower()]
    items = sorted(items, key=lambda x: x.get("updated_at", ""), reverse=True)
    return ok(paginate(items, page, page_size))


@router.post("")
def create_style(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    now = now_iso()
    item = {
        "id": new_id("style"),
        "name": data.get("name", "New Style"),
        "prompt": data.get("prompt", ""),
        "tags": data.get("tags", []),
        "created_at": now,
        "updated_at": now,
    }
    upsert_item("styles", item)
    add_event("style.created", "style", item["id"], "Style created")
    return ok(item)


@router.patch("/{style_id}")
def update_style(style_id: str, payload: dict = Body(default={})):
    item = get_item("styles", style_id)
    if not item:
        raise HTTPException(status_code=404, detail="Style not found")
    item.update(deserialize_keys(payload))
    item["updated_at"] = now_iso()
    upsert_item("styles", item)
    add_event("style.updated", "style", style_id, "Style updated")
    return ok(item)


@router.delete("/{style_id}")
def remove_style(style_id: str):
    if not delete_item("styles", style_id):
        raise HTTPException(status_code=404, detail="Style not found")
    add_event("style.deleted", "style", style_id, "Style deleted")
    return ok({"deleted": True})
