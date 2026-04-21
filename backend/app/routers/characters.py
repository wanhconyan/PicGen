from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import delete_item, get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event

router = APIRouter(prefix="/characters", tags=["characters"])


@router.get("")
def list_characters(
    page: int = Query(default=1),
    page_size: int = Query(default=20),
    keyword: str | None = Query(default=None),
):
    items = list_items("characters")
    if keyword:
        q = keyword.lower()
        items = [item for item in items if q in item.get("name", "").lower() or q in item.get("description", "").lower()]
    items = sorted(items, key=lambda x: x.get("updated_at", ""), reverse=True)
    return ok(paginate(items, page, page_size))


@router.get("/{character_id}")
def get_character(character_id: str):
    item = get_item("characters", character_id)
    if not item:
        raise HTTPException(status_code=404, detail="Character not found")
    return ok(item)


@router.post("")
def create_character(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    now = now_iso()
    item = {
        "id": new_id("char"),
        "name": data.get("name", "New Character"),
        "description": data.get("description", ""),
        "gender": data.get("gender", "unknown"),
        "style_tags": data.get("style_tags", []),
        "status": data.get("status", "draft"),
        "created_at": now,
        "updated_at": now,
    }
    upsert_item("characters", item)
    add_event("character.created", "character", item["id"], "Character created")
    return ok(item)


@router.patch("/{character_id}")
def update_character(character_id: str, payload: dict = Body(default={})):
    item = get_item("characters", character_id)
    if not item:
        raise HTTPException(status_code=404, detail="Character not found")
    patch = deserialize_keys(payload)
    item.update(patch)
    item["updated_at"] = now_iso()
    upsert_item("characters", item)
    add_event("character.updated", "character", character_id, "Character updated")
    return ok(item)


@router.delete("/{character_id}")
def remove_character(character_id: str):
    if not delete_item("characters", character_id):
        raise HTTPException(status_code=404, detail="Character not found")
    add_event("character.deleted", "character", character_id, "Character deleted")
    return ok({"deleted": True})
