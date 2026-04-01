from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routes.ai import router as ai_router
from app.routes.notifications import router as notifications_router
from app.routes.notifications_auto import router as notifications_auto_router
from app.routes.config import router as config_router
from app.routes.student_portal import router as student_router
from app.routes.upload import router as upload_router
from app.routes.visualizations import router as visualizations_router
from app.routes.overview import router as overview_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(ai_router)
app.include_router(notifications_router)
app.include_router(notifications_auto_router)
app.include_router(config_router)
app.include_router(student_router)
app.include_router(visualizations_router)
app.include_router(overview_router)

visualizations_dir = (Path(__file__).resolve().parent.parent / "visualizations").resolve()
visualizations_dir.mkdir(parents=True, exist_ok=True)
app.mount("/visualizations", StaticFiles(directory=str(visualizations_dir)), name="visualizations")
