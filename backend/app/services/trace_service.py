from __future__ import annotations

from app.core.storage import get_item, list_items


def get_task_trace(task_id: str) -> dict | None:
    task = get_item("tasks", task_id)
    if not task:
        return None
    results = [r for r in list_items("results") if r.get("task_id") == task_id]
    result_ids = {r.get("id") for r in results}
    reviews = [item for item in list_items("reviews") if item.get("result_id") in result_ids]
    exports = [item for item in list_items("exports") if item.get("result_id") in result_ids]
    return {"task": task, "results": results, "reviews": reviews, "exports": exports}


def get_result_trace(result_id: str) -> dict | None:
    result = get_item("results", result_id)
    if not result:
        return None
    task = get_item("tasks", result.get("task_id")) if result.get("task_id") else None
    reviews = [item for item in list_items("reviews") if item.get("result_id") == result_id]
    exports = [item for item in list_items("exports") if item.get("result_id") == result_id]
    base_images = [item for item in list_items("base_images") if item.get("result_id") == result_id]
    return {
        "result": result,
        "task": task,
        "reviews": reviews,
        "exports": exports,
        "base_images": base_images,
    }
