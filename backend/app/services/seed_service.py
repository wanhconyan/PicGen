from __future__ import annotations

from app.core.storage import read_db, write_db
from app.core.utils import now_iso
from app.services.event_log import add_event


def seed_demo() -> dict:
    db = read_db()
    if db.get("characters"):
        return {"seeded": False, "reason": "already_seeded"}

    ts = now_iso()
    character = {
        "id": "char_amy",
        "name": "Amy",
        "gender": "female",
        "description": "Demo heroine",
        "style_tags": ["anime", "fantasy"],
        "status": "production_ready",
        "created_at": ts,
        "updated_at": ts,
    }
    outfit = {
        "id": "outfit_knight",
        "name": "Knight Armor",
        "prompt": "silver armor with blue cape",
        "negative_prompt": "blurry",
        "tags": ["armor"],
        "version": 1,
        "created_at": ts,
        "updated_at": ts,
    }
    style = {
        "id": "style_clean",
        "name": "Clean Illustration",
        "prompt": "clean lines, game concept art",
        "tags": ["clean", "concept"],
        "created_at": ts,
        "updated_at": ts,
    }
    mask = {
        "id": "mask_weapon",
        "name": "Weapon Area",
        "part": "weapon",
        "mask_path": "masks/weapon.png",
        "created_at": ts,
    }

    db["characters"].append(character)
    db["outfits"].append(outfit)
    db["styles"].append(style)
    db["mask_templates"].append(mask)

    write_db(db)
    add_event("seed.completed", "system", "seed_demo", "Demo data seeded")
    return {"seeded": True}
