from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import delete_item, get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event

router = APIRouter(prefix="/outfits", tags=["outfits"])


@router.get("")
def list_outfits(page: int = Query(default=1), page_size: int = Query(default=20), keyword: str | None = Query(default=None)):
    items = list_items("outfits")
    if keyword:
        q = keyword.lower()
        items = [item for item in items if q in item.get("name", "").lower() or q in item.get("prompt", "").lower()]
    items = sorted(items, key=lambda x: x.get("updated_at", ""), reverse=True)
    return ok(paginate(items, page, page_size))


@router.post("")
def create_outfit(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    now = now_iso()
    item = {
        "id": new_id("outfit"),
        "name": data.get("name", "New Outfit"),
        "prompt": data.get("prompt", ""),
        "negative_prompt": data.get("negative_prompt", ""),
        "tags": data.get("tags", []),
        "version": data.get("version", 1),
        "created_at": now,
        "updated_at": now,
    }
    upsert_item("outfits", item)
    add_event("outfit.created", "outfit", item["id"], "Outfit created")
    return ok(item)


@router.patch("/{outfit_id}")
def update_outfit(outfit_id: str, payload: dict = Body(default={})):
    item = get_item("outfits", outfit_id)
    if not item:
        raise HTTPException(status_code=404, detail="Outfit not found")
    item.update(deserialize_keys(payload))
    item["updated_at"] = now_iso()
    upsert_item("outfits", item)
    add_event("outfit.updated", "outfit", outfit_id, "Outfit updated")
    return ok(item)


@router.delete("/{outfit_id}")
def remove_outfit(outfit_id: str):
    if not delete_item("outfits", outfit_id):
        raise HTTPException(status_code=404, detail="Outfit not found")
    add_event("outfit.deleted", "outfit", outfit_id, "Outfit deleted")
    return ok({"deleted": True})
