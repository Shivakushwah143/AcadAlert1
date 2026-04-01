from pathlib import Path
from typing import List

from fastapi import APIRouter

from app.services.visualization_service import generate_visualizations

router = APIRouter(prefix="/api/visualizations", tags=["visualizations"])

_VIS_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}


def _list_visualizations(directory: Path) -> List[dict]:
    if not directory.exists():
        return []

    items: List[dict] = []
    for path in directory.iterdir():
        if not path.is_file():
            continue
        if path.suffix.lower() not in _VIS_EXTS:
            continue

        stat = path.stat()
        items.append(
            {
                "name": path.stem.replace("_", " ").title(),
                "filename": path.name,
                "url": f"/visualizations/{path.name}",
                "size": stat.st_size,
                "modified": int(stat.st_mtime),
            }
        )

    items.sort(key=lambda item: item["modified"], reverse=True)
    return items


@router.get("/list")
async def list_visualizations():
    visualizations_dir = (Path(__file__).resolve().parent.parent.parent / "visualizations").resolve()
    return _list_visualizations(visualizations_dir)


@router.post("/generate")
async def generate_visualizations_now():
    return await generate_visualizations()
