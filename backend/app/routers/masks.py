from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import delete_item, get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event

router = APIRouter(prefix="/masks", tags=["masks"])


@router.get("")
def list_masks(page: int = Query(default=1), page_size: int = Query(default=20), part: str | None = Query(default=None)):
    items = list_items("mask_templates")
    if part:
        items = [item for item in items if item.get("part") == part]
    items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
    return ok(paginate(items, page, page_size))


@router.post("")
def create_mask(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    item = {
        "id": new_id("mask"),
        "name": data.get("name", "New Mask"),
        "part": data.get("part", "custom"),
        "mask_path": data.get("mask_path", "masks/custom.png"),
        "created_at": now_iso(),
    }
    upsert_item("mask_templates", item)
    add_event("mask.created", "mask", item["id"], "Mask template created")
    return ok(item)


@router.patch("/{mask_id}")
def update_mask(mask_id: str, payload: dict = Body(default={})):
    item = get_item("mask_templates", mask_id)
    if not item:
        raise HTTPException(status_code=404, detail="Mask not found")
    item.update(deserialize_keys(payload))
    upsert_item("mask_templates", item)
    add_event("mask.updated", "mask", mask_id, "Mask template updated")
    return ok(item)


@router.delete("/{mask_id}")
def remove_mask(mask_id: str):
    if not delete_item("mask_templates", mask_id):
        raise HTTPException(status_code=404, detail="Mask not found")
    add_event("mask.deleted", "mask", mask_id, "Mask template deleted")
    return ok({"deleted": True})
