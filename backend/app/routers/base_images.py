from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event

router = APIRouter(prefix="/base-images", tags=["base_images"])


@router.get("")
def list_base_images(page: int = Query(default=1), page_size: int = Query(default=20), character_id: str | None = Query(default=None)):
    items = list_items("base_images")
    if character_id:
        items = [item for item in items if item.get("character_id") == character_id]
    items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
    return ok(paginate(items, page, page_size))


@router.post("")
def create_base_image(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    if not data.get("character_id"):
        raise HTTPException(status_code=400, detail="characterId is required")
    item = {
        "id": new_id("base"),
        "character_id": data.get("character_id"),
        "result_id": data.get("result_id"),
        "image_url": data.get("image_url", "https://picsum.photos/seed/base/1024/1024"),
        "is_primary": bool(data.get("is_primary", False)),
        "created_at": now_iso(),
    }
    if item["is_primary"]:
        for current in list_items("base_images"):
            if current.get("character_id") == item["character_id"] and current.get("is_primary"):
                current["is_primary"] = False
                upsert_item("base_images", current)
    upsert_item("base_images", item)
    add_event("base.created", "character", item["character_id"], "Base image created")
    return ok(item)


@router.post("/{base_id}/set-primary")
def set_primary(base_id: str):
    item = get_item("base_images", base_id)
    if not item:
        raise HTTPException(status_code=404, detail="Base image not found")
    for current in list_items("base_images"):
        if current.get("character_id") == item.get("character_id"):
            current["is_primary"] = current.get("id") == base_id
            upsert_item("base_images", current)
    add_event("base.primary_set", "base_image", base_id, "Base image set primary")
    return ok(get_item("base_images", base_id))
