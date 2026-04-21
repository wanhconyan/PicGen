from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.storage import ensure_db
from app.routers.base_images import router as base_images_router
from app.routers.characters import router as characters_router
from app.routers.exports import router as exports_router
from app.routers.health import router as health_router
from app.routers.logs import router as logs_router
from app.routers.masks import router as masks_router
from app.routers.outfits import router as outfits_router
from app.routers.reviews import router as reviews_router
from app.routers.results import router as results_router
from app.routers.seed import router as seed_router
from app.routers.settings import router as settings_router
from app.routers.styles import router as styles_router
from app.routers.tasks import router as tasks_router
from app.routers.traces import router as traces_router

ensure_db()

app = FastAPI(title="PicGen API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(seed_router)
app.include_router(settings_router)
app.include_router(characters_router)
app.include_router(outfits_router)
app.include_router(styles_router)
app.include_router(masks_router)
app.include_router(base_images_router)
app.include_router(tasks_router)
app.include_router(results_router)
app.include_router(reviews_router)
app.include_router(exports_router)
app.include_router(traces_router)
app.include_router(logs_router)
