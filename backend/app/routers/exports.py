from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.services.export_service import batch_export, create_export, list_exports

router = APIRouter(prefix="/exports", tags=["exports"])


@router.get("")
def get_exports(page: int = Query(default=1), page_size: int = Query(default=20), keyword: str | None = Query(default=None)):
    items = list_exports()
    if keyword:
        q = keyword.lower()
        items = [item for item in items if q in item.get("file_name", "").lower() or q in item.get("path", "").lower()]
    return ok(paginate(items, page, page_size))


@router.post("/create")
def create_export_api(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    result_id = data.get("result_id")
    if not result_id:
        raise HTTPException(status_code=400, detail="resultId is required")
    try:
        item = create_export(result_id, output_path=data.get("path", "exports"), file_name=data.get("file_name"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ok(item)


@router.post("/batch-create")
def create_batch_export_api(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    result_ids = data.get("result_ids") or []
    if not result_ids:
        raise HTTPException(status_code=400, detail="resultIds is required")
    items = batch_export(result_ids, output_path=data.get("path", "exports"))
    return ok({"items": items, "count": len(items)})
