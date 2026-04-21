from fastapi import APIRouter, Query

from app.core.pagination import paginate
from app.core.serializers import ok
from app.services.event_log import list_events

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("")
def get_logs(
    page: int = Query(default=1),
    page_size: int = Query(default=20),
    target_type: str | None = Query(default=None),
    target_id: str | None = Query(default=None),
):
    items = list_events()
    if target_type:
        items = [item for item in items if item.get("target_type") == target_type]
    if target_id:
        items = [item for item in items if item.get("target_id") == target_id]
    return ok(paginate(items, page, page_size))
