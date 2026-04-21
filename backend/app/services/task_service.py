from __future__ import annotations

from typing import Any

from app.core.storage import get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event


def _placeholder_image(seed: str) -> str:
    return f"https://picsum.photos/seed/{seed}/1024/1024"


def create_task(task_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    outfit_ids = payload.get("outfit_ids") or []
    if payload.get("outfit_id") and payload.get("outfit_id") not in outfit_ids:
        outfit_ids.append(payload["outfit_id"])

    item = {
        "id": new_id("task"),
        "type": task_type,
        "status": "queued",
        "character_id": payload.get("character_id"),
        "outfit_ids": outfit_ids,
        "style_id": payload.get("style_id"),
        "source_result_id": payload.get("source_result_id"),
        "mask_template_id": payload.get("mask_template_id"),
        "prompt": payload.get("prompt", ""),
        "negative_prompt": payload.get("negative_prompt", ""),
        "params": payload.get("params", {}),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    upsert_item("tasks", item)
    add_event("task.created", "task", item["id"], f"Task {task_type} created", {"task_type": task_type})
    execute_task(item["id"])
    return get_item("tasks", item["id"]) or item


def execute_task(task_id: str) -> dict[str, Any] | None:
    task = get_item("tasks", task_id)
    if not task:
        return None

    task["status"] = "running"
    task["updated_at"] = now_iso()
    upsert_item("tasks", task)
    add_event("task.running", "task", task_id, "Task is running")

    result_ids: list[str] = []
    outfit_ids = task.get("outfit_ids") or []
    if task.get("type") in {"batch_outfit_generate", "generate"}:
        target_outfits = outfit_ids or [None]
        for outfit_id in target_outfits:
            result = {
                "id": new_id("result"),
                "task_id": task_id,
                "character_id": task.get("character_id"),
                "outfit_id": outfit_id,
                "status": "success",
                "image_url": _placeholder_image(new_id("img")),
                "thumb_url": _placeholder_image(new_id("thumb")),
                "review_status": "pending_review",
                "score": None,
                "metadata": {
                    "task_type": task.get("type"),
                    "prompt": task.get("prompt", ""),
                },
                "created_at": now_iso(),
            }
            upsert_item("results", result)
            result_ids.append(result["id"])
    else:
        result = {
            "id": new_id("result"),
            "task_id": task_id,
            "character_id": task.get("character_id"),
            "outfit_id": (outfit_ids[0] if outfit_ids else None),
            "status": "success",
            "image_url": _placeholder_image(new_id("img")),
            "thumb_url": _placeholder_image(new_id("thumb")),
            "review_status": "pending_review",
            "score": None,
            "metadata": {
                "task_type": task.get("type"),
                "source_result_id": task.get("source_result_id"),
                "mask_template_id": task.get("mask_template_id"),
                "prompt": task.get("prompt", ""),
            },
            "created_at": now_iso(),
        }
        upsert_item("results", result)
        result_ids.append(result["id"])

    task["status"] = "success"
    task["updated_at"] = now_iso()
    task["result_ids"] = result_ids
    upsert_item("tasks", task)
    add_event("task.success", "task", task_id, "Task finished", {"result_ids": result_ids})
    return task


def list_tasks() -> list[dict[str, Any]]:
    return sorted(list_items("tasks"), key=lambda x: x.get("created_at", ""), reverse=True)


def rework_result(result_id: str, prompt: str = "") -> dict[str, Any]:
    source = get_item("results", result_id)
    if not source:
        raise ValueError("Result not found")
    payload = {
        "character_id": source.get("character_id"),
        "outfit_id": source.get("outfit_id"),
        "source_result_id": source.get("id"),
        "prompt": prompt,
    }
    return create_task("rework", payload)
