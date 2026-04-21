from __future__ import annotations

import json
from pathlib import Path
from threading import Lock
from typing import Any

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "db.json"
_LOCK = Lock()


_DEFAULT_DB: dict[str, Any] = {
    "characters": [],
    "outfits": [],
    "styles": [],
    "mask_templates": [],
    "base_images": [],
    "tasks": [],
    "results": [],
    "reviews": [],
    "exports": [],
    "event_logs": [],
    "settings": {
        "demo_mode": True,
        "api_base_url": "https://api.openai.com/v1",
        "model": "gpt-image-1",
        "max_concurrency": 3,
        "default_size": "1024x1024",
        "default_quality": "high",
        "default_format": "png",
        "polling_interval_ms": 5000,
        "open_api_key": "",
    },
}


def _clone_default() -> dict[str, Any]:
    return json.loads(json.dumps(_DEFAULT_DB))


def ensure_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DB_PATH.exists():
        DB_PATH.write_text(json.dumps(_clone_default(), ensure_ascii=False, indent=2), encoding="utf-8")


def read_db() -> dict[str, Any]:
    ensure_db()
    with _LOCK:
        return json.loads(DB_PATH.read_text(encoding="utf-8"))


def write_db(db: dict[str, Any]) -> None:
    ensure_db()
    with _LOCK:
        DB_PATH.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")


def list_items(collection: str) -> list[dict[str, Any]]:
    db = read_db()
    return db.get(collection, [])


def upsert_item(collection: str, item: dict[str, Any]) -> dict[str, Any]:
    db = read_db()
    items = db.setdefault(collection, [])
    for idx, current in enumerate(items):
        if current.get("id") == item.get("id"):
            items[idx] = item
            write_db(db)
            return item
    items.append(item)
    write_db(db)
    return item


def delete_item(collection: str, item_id: str) -> bool:
    db = read_db()
    items = db.setdefault(collection, [])
    before = len(items)
    items[:] = [item for item in items if item.get("id") != item_id]
    changed = len(items) != before
    if changed:
        write_db(db)
    return changed


def get_item(collection: str, item_id: str) -> dict[str, Any] | None:
    for item in list_items(collection):
        if item.get("id") == item_id:
            return item
    return None


def update_settings(patch: dict[str, Any]) -> dict[str, Any]:
    db = read_db()
    settings = db.setdefault("settings", {})
    settings.update(patch)
    write_db(db)
    return settings


def get_settings() -> dict[str, Any]:
    db = read_db()
    settings = db.setdefault("settings", {})
    if "open_api_key" not in settings:
        settings["open_api_key"] = ""
        write_db(db)
    return settings
