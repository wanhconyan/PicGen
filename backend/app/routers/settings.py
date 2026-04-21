from fastapi import APIRouter, Body

from app.core.serializers import deserialize_keys, ok
from app.core.storage import get_settings, update_settings
from app.services.event_log import add_event

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("")
def get_settings_api():
    return ok(get_settings())


@router.patch("")
def patch_settings(payload: dict = Body(default={})):
    patch = deserialize_keys(payload)
    settings = update_settings(patch)
    add_event("settings.updated", "settings", "global", "Settings updated", patch)
    return ok(settings)
