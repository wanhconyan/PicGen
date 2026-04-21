from fastapi import APIRouter, HTTPException

from app.core.serializers import ok
from app.services.trace_service import get_result_trace, get_task_trace

router = APIRouter(prefix="/traces", tags=["traces"])


@router.get("/tasks/{task_id}")
def task_trace(task_id: str):
    data = get_task_trace(task_id)
    if not data:
        raise HTTPException(status_code=404, detail="Task not found")
    return ok(data)


@router.get("/results/{result_id}")
def result_trace(result_id: str):
    data = get_result_trace(result_id)
    if not data:
        raise HTTPException(status_code=404, detail="Result not found")
    return ok(data)
