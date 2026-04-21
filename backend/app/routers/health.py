from fastapi import APIRouter

from app.core.serializers import ok

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check():
    return ok({"status": "ok"})
