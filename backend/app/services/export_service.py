from __future__ import annotations

import base64
import json
from pathlib import Path
from urllib.parse import urlparse

import httpx
from typing import Any

from app.core.storage import get_item, list_items, upsert_item
from app.core.utils import new_id, now_iso
from app.services.event_log import add_event

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_PROJECT_ROOT = _BACKEND_ROOT.parent


def _resolve_output_dir(output_path: str) -> Path:
    target = Path(output_path)
    if not target.is_absolute():
        target = _PROJECT_ROOT / target
    target.mkdir(parents=True, exist_ok=True)
    return target


def _read_result_image_bytes(image_url: str) -> tuple[bytes, str]:
    if image_url.startswith("http://") or image_url.startswith("https://"):
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(image_url)
            response.raise_for_status()
            ext = ".png"
            content_type = response.headers.get("content-type", "")
            if "jpeg" in content_type or "jpg" in content_type:
                ext = ".jpg"
            elif "webp" in content_type:
                ext = ".webp"
            return response.content, ext

    if image_url.startswith("data:"):
        header, payload = image_url.split(",", 1)
        mime = header.split(";")[0].replace("data:", "").lower()
        ext = ".png"
        if "jpeg" in mime or "jpg" in mime:
            ext = ".jpg"
        elif "webp" in mime:
            ext = ".webp"
        elif "gif" in mime:
            ext = ".gif"
        data = base64.b64decode(payload)
        return data, ext

    parsed = urlparse(image_url)
    if image_url.startswith("/generated/") or parsed.path.startswith("/generated/"):
        rel = image_url if image_url.startswith("/generated/") else parsed.path
        local_path = _BACKEND_ROOT / "data" / rel.lstrip("/")
        if not local_path.exists():
            raise FileNotFoundError(f"Local generated image not found: {local_path}")
        ext = local_path.suffix or ".png"
        return local_path.read_bytes(), ext

    potential_path = Path(image_url)
    if potential_path.exists():
        ext = potential_path.suffix or ".png"
        return potential_path.read_bytes(), ext

    raise ValueError("Unsupported image_url source")


def _build_metadata(result: dict[str, Any], task: dict[str, Any] | None, review: dict[str, Any] | None, export_item: dict[str, Any]) -> dict[str, Any]:
    return {
        "export": {
            "id": export_item["id"],
            "status": export_item["status"],
            "created_at": export_item["created_at"],
            "path": export_item["path"],
            "file_name": export_item["file_name"],
        },
        "result": {
            "id": result.get("id"),
            "task_id": result.get("task_id"),
            "character_id": result.get("character_id"),
            "outfit_id": result.get("outfit_id"),
            "review_status": result.get("review_status"),
            "score": result.get("score"),
            "image_url": result.get("image_url"),
            "metadata": result.get("metadata") or {},
            "created_at": result.get("created_at"),
        },
        "task": task or {},
        "review": review or {},
    }


def _latest_review_for_result(result_id: str) -> dict[str, Any] | None:
    reviews = [item for item in list_items("reviews") if item.get("result_id") == result_id]
    if not reviews:
        return None
    return sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)[0]


def create_export(
    result_id: str,
    output_path: str = "exports",
    file_name: str | None = None,
    include_metadata: bool = True,
    include_manifest: bool = True,
    include_thumbnail: bool = False,
) -> dict[str, Any]:
    result = get_item("results", result_id)
    if not result:
        raise ValueError("Result not found")
    if result.get("review_status") != "approved":
        raise ValueError("Result must be approved before export")

    export = {
        "id": new_id("export"),
        "result_id": result_id,
        "status": "pending",
        "path": output_path,
        "file_name": file_name or f"{result_id}.png",
        "metadata_path": None,
        "thumbnail_path": None,
        "manifest_path": None,
        "error_message": None,
        "created_at": now_iso(),
    }

    try:
        output_dir = _resolve_output_dir(output_path)
        data, detected_ext = _read_result_image_bytes(str(result.get("image_url") or ""))

        target_name = export["file_name"]
        if not Path(target_name).suffix:
            target_name = f"{target_name}{detected_ext or '.png'}"
            export["file_name"] = target_name

        image_path = output_dir / target_name
        image_path.write_bytes(data)
        export["path"] = str(image_path)

        task = get_item("tasks", str(result.get("task_id"))) if result.get("task_id") else None
        review = _latest_review_for_result(result_id)

        if include_metadata:
            metadata_payload = _build_metadata(result, task, review, export)
            metadata_path = output_dir / f"{Path(target_name).stem}.metadata.json"
            metadata_path.write_text(json.dumps(metadata_payload, ensure_ascii=False, indent=2), encoding="utf-8")
            export["metadata_path"] = str(metadata_path)

        if include_thumbnail:
            thumbnail_path = output_dir / f"{Path(target_name).stem}.thumb{image_path.suffix or '.png'}"
            thumbnail_path.write_bytes(data)
            export["thumbnail_path"] = str(thumbnail_path)

        if include_manifest:
            manifest_payload = {
                "generated_at": now_iso(),
                "items": [
                    {
                        "export_id": export["id"],
                        "result_id": result_id,
                        "status": "success",
                        "image_path": str(image_path),
                        "metadata_path": export.get("metadata_path"),
                        "thumbnail_path": export.get("thumbnail_path"),
                    }
                ],
            }
            manifest_path = output_dir / f"{Path(target_name).stem}.manifest.json"
            manifest_path.write_text(json.dumps(manifest_payload, ensure_ascii=False, indent=2), encoding="utf-8")
            export["manifest_path"] = str(manifest_path)

        export["status"] = "success"
        upsert_item("exports", export)
        add_event(
            "export.created",
            "result",
            result_id,
            "Result exported",
            {
                "export_id": export["id"],
                "path": export.get("path"),
                "metadata_path": export.get("metadata_path"),
                "thumbnail_path": export.get("thumbnail_path"),
                "manifest_path": export.get("manifest_path"),
            },
        )
        return export
    except Exception as exc:  # noqa: BLE001
        export["status"] = "failed"
        export["error_message"] = str(exc)
        upsert_item("exports", export)
        add_event(
            "export.failed",
            "result",
            result_id,
            "Result export failed",
            {"export_id": export["id"], "error": str(exc)},
        )
        return export


def list_exports() -> list[dict[str, Any]]:
    return sorted(list_items("exports"), key=lambda x: x.get("created_at", ""), reverse=True)


def batch_export(
    result_ids: list[str],
    output_path: str = "exports",
    include_metadata: bool = True,
    include_manifest: bool = True,
    include_thumbnail: bool = False,
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for result_id in result_ids:
        out.append(
            create_export(
                result_id,
                output_path=output_path,
                include_metadata=include_metadata,
                include_manifest=include_manifest,
                include_thumbnail=include_thumbnail,
            )
        )

    if include_manifest and out:
        output_dir = _resolve_output_dir(output_path)
        batch_manifest = {
            "generated_at": now_iso(),
            "count": len(out),
            "items": [
                {
                    "export_id": item.get("id"),
                    "result_id": item.get("result_id"),
                    "status": item.get("status"),
                    "image_path": item.get("path"),
                    "metadata_path": item.get("metadata_path"),
                    "thumbnail_path": item.get("thumbnail_path"),
                    "error_message": item.get("error_message"),
                }
                for item in out
            ],
        }
        batch_manifest_path = output_dir / f"batch_{new_id('manifest')}.json"
        batch_manifest_path.write_text(json.dumps(batch_manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        for item in out:
            item["manifest_path"] = str(batch_manifest_path)
            upsert_item("exports", item)

    return out
