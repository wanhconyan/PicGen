from __future__ import annotations

import base64
import os
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.storage import get_item, get_settings, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event


DATA_DIR = Path(__file__).resolve().parents[2] / "data"
GENERATED_DIR = DATA_DIR / "generated"


def _is_edit_task(task: dict[str, Any]) -> bool:
    return bool(task.get("source_result_id"))


def _api_key() -> str:
    key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not key:
        settings = get_settings()
        key = str(settings.get("open_api_key") or "").strip()
    if not key:
        raise RuntimeError("Missing OPENAI_API_KEY, cannot call image API")
    return key


def _build_generate_payload(task: dict[str, Any], settings: dict[str, Any]) -> dict[str, Any]:
    params = task.get("params") or {}
    payload: dict[str, Any] = {
        "model": params.get("model") or settings.get("model") or "gpt-image-1",
        "prompt": task.get("prompt") or "",
        "size": params.get("size") or settings.get("default_size") or "1024x1024",
        "quality": params.get("quality") or settings.get("default_quality") or "high",
        "n": params.get("n") or 1,
    }
    if task.get("negative_prompt"):
        payload["negative_prompt"] = task["negative_prompt"]
    if "background" in params:
        payload["background"] = params.get("background")
    if "fidelity" in params:
        payload["fidelity"] = params.get("fidelity")
    if "format" in params:
        payload["format"] = params.get("format")
    elif settings.get("default_format"):
        payload["format"] = settings.get("default_format")
    return payload


def _build_edit_payload(task: dict[str, Any], settings: dict[str, Any]) -> dict[str, Any]:
    return _build_generate_payload(task, settings)


def _save_b64_image(image_b64: str) -> str:
    data = base64.b64decode(image_b64)
    result_id = new_id("img")
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    out_file = GENERATED_DIR / f"{result_id}.png"
    out_file.write_bytes(data)
    return f"/generated/{out_file.name}"


def _extract_image_url(resp_json: dict[str, Any]) -> str:
    data = resp_json.get("data") or []
    if not data:
        raise RuntimeError("Image API response missing data")
    first = data[0] or {}
    if first.get("url"):
        return first["url"]
    if first.get("b64_json"):
        return _save_b64_image(first["b64_json"])
    raise RuntimeError("Image API response missing url/b64_json")


def _decode_data_url(value: str) -> bytes:
    _, encoded = value.split(",", 1)
    return base64.b64decode(encoded)


def _decode_mask_bytes(mask_value: str) -> bytes | None:
    value = (mask_value or "").strip()
    if not value:
        return None

    if value.startswith("data:"):
        if "," not in value:
            raise RuntimeError("Invalid mask data URL")
        return _decode_data_url(value)

    try:
        return base64.b64decode(value, validate=True)
    except Exception:
        return None


def _local_generated_file_from_url(value: str) -> Path | None:
    parsed = urlparse(value)
    if parsed.scheme or parsed.netloc:
        return None
    path_part = parsed.path or ""
    if not path_part.startswith("/generated/"):
        return None
    rel = path_part[len("/generated/") :].lstrip("/")
    if not rel:
        return None
    candidate = (GENERATED_DIR / rel).resolve()
    try:
        candidate.relative_to(GENERATED_DIR.resolve())
    except ValueError:
        return None
    return candidate


def _load_source_image_bytes(image_ref: str) -> bytes:
    value = (image_ref or "").strip()
    if not value:
        raise RuntimeError("Empty source image reference")

    if value.startswith("data:"):
        return _decode_data_url(value)

    if value.startswith("http://") or value.startswith("https://"):
        with httpx.Client(timeout=60.0) as client:
            resp = client.get(value)
            resp.raise_for_status()
            return resp.content

    local_file = _local_generated_file_from_url(value)
    if local_file and local_file.exists():
        return local_file.read_bytes()

    raise RuntimeError(f"Unsupported or missing source image: {image_ref}")


def _resolve_mask_path(task: dict[str, Any]) -> Path | None:
    mask_template_id = task.get("mask_template_id")
    if not mask_template_id:
        return None

    mask_template = get_item("mask_templates", mask_template_id)
    if not mask_template:
        return None

    for field in ("mask_path", "mask_url"):
        raw = (mask_template.get(field) or "").strip()
        if not raw:
            continue

        parsed = urlparse(raw)
        if parsed.scheme or parsed.netloc:
            continue

        candidate = Path(raw)
        if not candidate.is_absolute():
            candidate = DATA_DIR / candidate

        if candidate.exists() and candidate.is_file():
            return candidate

    return None


def _extract_unknown_parameter_name(resp: httpx.Response) -> str | None:
    if resp.status_code != 400:
        return None

    try:
        body = resp.json()
    except Exception:
        body = None

    error = body.get("error") if isinstance(body, dict) else None
    if not isinstance(error, dict):
        return None

    if error.get("code") != "unknown_parameter":
        return None

    param = error.get("param")
    if isinstance(param, str) and param.strip():
        return param.strip()

    message = str(error.get("message") or "")
    match = re.search(r"Unknown parameter:\s*'([^']+)'", message)
    if match:
        return match.group(1)

    return None


def _call_image_api(task: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    api_base_url = (settings.get("api_base_url") or "https://api.openai.com/v1").rstrip("/")
    api_key = _api_key()

    endpoint = "/images/generations"
    payload = _build_generate_payload(task, settings)

    max_unknown_param_retries = 3

    with httpx.Client(timeout=60.0) as client:
        if _is_edit_task(task):
            source_result_id = task.get("source_result_id")
            source_result = get_item("results", source_result_id) if source_result_id else None
            if not source_result:
                raise RuntimeError(f"Source result not found: {source_result_id}")

            image_ref = source_result.get("image_url") or ""
            image_bytes = _load_source_image_bytes(image_ref)

            endpoint = "/images/edits"
            payload = _build_edit_payload(task, settings)
            files = {
                "image": ("source.png", image_bytes, "image/png"),
            }

            params = task.get("params") or {}
            mask_bytes = _decode_mask_bytes(str(params.get("mask") or ""))
            if mask_bytes:
                files["mask"] = ("drawn-mask.png", mask_bytes, "image/png")
            else:
                mask_path = _resolve_mask_path(task)
                if mask_path:
                    files["mask"] = (mask_path.name, mask_path.read_bytes(), "image/png")

            attempt = 0
            while True:
                payload_data = {k: str(v) for k, v in payload.items() if v is not None}
                payload_data.pop("mask", None)

                resp = client.post(
                    f"{api_base_url}{endpoint}",
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=payload_data,
                    files=files,
                )

                unknown_param = _extract_unknown_parameter_name(resp)
                if unknown_param and attempt < max_unknown_param_retries and unknown_param in payload:
                    payload.pop(unknown_param, None)
                    attempt += 1
                    continue
                break
        else:
            attempt = 0
            while True:
                resp = client.post(
                    f"{api_base_url}{endpoint}",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                )

                unknown_param = _extract_unknown_parameter_name(resp)
                if unknown_param and attempt < max_unknown_param_retries and unknown_param in payload:
                    payload.pop(unknown_param, None)
                    attempt += 1
                    continue
                break

    if resp.status_code >= 400:
        raise RuntimeError(f"Image API error {resp.status_code}: {resp.text[:300]}")

    body = resp.json()
    image_url = _extract_image_url(body)
    return {
        "image_url": image_url,
        "metadata": {
            "task_type": task.get("type"),
            "prompt": task.get("prompt", ""),
            "source_result_id": task.get("source_result_id"),
            "mask_template_id": task.get("mask_template_id"),
            "request": payload,
        },
    }


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
        "error": None,
        "result_ids": [],
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
    task["error"] = None
    task["updated_at"] = now_iso()
    upsert_item("tasks", task)
    add_event("task.running", "task", task_id, "Task is running")

    result_ids: list[str] = []
    outfit_ids = task.get("outfit_ids") or []

    try:
        if task.get("type") in {"batch_outfit_generate", "generate"}:
            target_outfits = outfit_ids or [None]
            for outfit_id in target_outfits:
                api_result = _call_image_api(task)
                result = {
                    "id": new_id("result"),
                    "task_id": task_id,
                    "character_id": task.get("character_id"),
                    "outfit_id": outfit_id,
                    "status": "success",
                    "image_url": api_result["image_url"],
                    "thumb_url": api_result["image_url"],
                    "review_status": "pending_review",
                    "score": None,
                    "metadata": api_result["metadata"],
                    "created_at": now_iso(),
                }
                upsert_item("results", result)
                result_ids.append(result["id"])
        else:
            api_result = _call_image_api(task)
            result = {
                "id": new_id("result"),
                "task_id": task_id,
                "character_id": task.get("character_id"),
                "outfit_id": (outfit_ids[0] if outfit_ids else None),
                "status": "success",
                "image_url": api_result["image_url"],
                "thumb_url": api_result["image_url"],
                "review_status": "pending_review",
                "score": None,
                "metadata": api_result["metadata"],
                "created_at": now_iso(),
            }
            upsert_item("results", result)
            result_ids.append(result["id"])

        task["status"] = "success"
        task["result_ids"] = result_ids
        task["updated_at"] = now_iso()
        upsert_item("tasks", task)
        add_event("task.success", "task", task_id, "Task finished", {"result_ids": result_ids})
    except Exception as exc:
        task["status"] = "failed"
        task["error"] = str(exc)
        task["result_ids"] = result_ids
        task["updated_at"] = now_iso()
        upsert_item("tasks", task)
        add_event("task.failed", "task", task_id, "Task failed", {"error": str(exc), "result_ids": result_ids})

    return get_item("tasks", task_id)


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
