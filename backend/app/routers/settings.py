from fastapi import APIRouter, Body

from app.core.serializers import deserialize_keys, ok
from app.core.storage import get_settings, update_settings
from app.services.event_log import add_event

router = APIRouter(prefix="/settings", tags=["settings"])


def _settings_response(settings: dict) -> dict:
    data = dict(settings)
    data["has_open_api_key"] = bool((settings.get("open_api_key") or "").strip())
    data.pop("open_api_key", None)
    return data


def _sanitize_patch_for_log(patch: dict) -> dict:
    data = dict(patch)
    if "open_api_key" in data:
        value = str(data.get("open_api_key") or "").strip()
        data["open_api_key"] = "***" if value else ""
    return data


@router.get("")
def get_settings_api():
    return ok(_settings_response(get_settings()))


@router.patch("")
def patch_settings(payload: dict = Body(default={})):
    patch = deserialize_keys(payload)
    settings = update_settings(patch)
    add_event("settings.updated", "settings", "global", "Settings updated", _sanitize_patch_for_log(patch))
    return ok(_settings_response(settings))
