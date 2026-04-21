from fastapi import APIRouter, Body, HTTPException, Query

from app.core.pagination import paginate
from app.core.serializers import deserialize_keys, ok
from app.core.storage import get_item
from app.services.task_service import create_task, execute_task, list_tasks, rework_result

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
def get_tasks(
    page: int = Query(default=1),
    page_size: int = Query(default=20),
    status: str | None = Query(default=None),
    task_type: str | None = Query(default=None),
    character_id: str | None = Query(default=None),
):
    items = list_tasks()
    if status:
        items = [item for item in items if item.get("status") == status]
    if task_type:
        items = [item for item in items if item.get("type") == task_type]
    if character_id:
        items = [item for item in items if item.get("character_id") == character_id]
    return ok(paginate(items, page, page_size))


@router.get("/{task_id}")
def get_task(task_id: str):
    item = get_item("tasks", task_id)
    if not item:
        raise HTTPException(status_code=404, detail="Task not found")
    return ok(item)


@router.post("/generate")
def generate(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    if not data.get("character_id"):
        raise HTTPException(status_code=400, detail="characterId is required")
    task = create_task("batch_outfit_generate", data)
    return ok(task)


@router.post("/local-edit")
def local_edit(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    if not data.get("source_result_id"):
        raise HTTPException(status_code=400, detail="sourceResultId is required")
    task = create_task("local_edit", data)
    return ok(task)


@router.post("/full-outfit-edit")
def full_outfit_edit(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    if not data.get("character_id"):
        raise HTTPException(status_code=400, detail="characterId is required")
    task = create_task("full_outfit_edit", data)
    return ok(task)


@router.post("/rework")
def rework(payload: dict = Body(default={})):
    data = deserialize_keys(payload)
    result_id = data.get("result_id")
    if not result_id:
        raise HTTPException(status_code=400, detail="resultId is required")
    try:
        task = rework_result(result_id, prompt=data.get("prompt", ""))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ok(task)


@router.post("/{task_id}/retry")
def retry(task_id: str):
    task = execute_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return ok(task)
