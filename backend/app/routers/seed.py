from fastapi import APIRouter

from app.core.serializers import ok
from app.services.seed_service import seed_demo

router = APIRouter(prefix="/seed", tags=["seed"])


@router.post("/demo")
def seed_demo_api():
    return ok(seed_demo())
