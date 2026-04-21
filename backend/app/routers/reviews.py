from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.services.review_service import create_review, list_reviews, promote_result_to_base

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("")
def get_reviews(page: int = Query(default=1), page_size: int = Query(default=20), decision: str | None = Query(default=None)):
    items = list_reviews()
    if decision:
        items = [item for item in items if item.get("decision") == decision]
    return ok(paginate(items, page, page_size))


@router.post("/decision")
def review_decision(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    result_id = data.get("result_id")
    decision = data.get("decision")
    if not result_id or not decision:
        raise HTTPException(status_code=400, detail="resultId and decision are required")
    try:
        review = create_review(result_id, decision=decision, comment=data.get("comment", ""), scores=data.get("scores"))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(review)


@router.post("/batch-decision")
def batch_decision(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    result_ids = data.get("result_ids") or []
    decision = data.get("decision")
    if not result_ids or not decision:
        raise HTTPException(status_code=400, detail="resultIds and decision are required")

    created = []
    for result_id in result_ids:
        try:
            created.append(create_review(result_id, decision=decision, comment=data.get("comment", ""), scores=data.get("scores")))
        except ValueError:
            continue
    return ok({"items": created, "count": len(created)})


@router.post("/promote-base")
def promote_to_base(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    result_id = data.get("result_id")
    if not result_id:
        raise HTTPException(status_code=400, detail="resultId is required")
    try:
        base = promote_result_to_base(result_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(base)
