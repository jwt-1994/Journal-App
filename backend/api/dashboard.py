import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Material, Category

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    # 各分类素材数量
    category_stats = (
        db.query(Category.name, func.count(Material.id).label("count"))
        .outerjoin(Material, Material.category_id == Category.id)
        .group_by(Category.id)
        .all()
    )

    total_materials = db.query(Material).count()
    total_size = db.query(func.sum(Material.file_size)).scalar() or 0

    # 抠图状态统计
    bg_stats = (
        db.query(Material.has_removed_bg, func.count(Material.id))
        .group_by(Material.has_removed_bg)
        .all()
    )
    bg_status_map = {s: c for s, c in bg_stats}

    return {
        "category_stats": [{"name": name, "count": count} for name, count in category_stats],
        "total_materials": total_materials,
        "total_size_bytes": total_size,
        "bg_status_stats": {
            "none": bg_status_map.get("none", 0),
            "processing": bg_status_map.get("processing", 0),
            "done": bg_status_map.get("done", 0),
            "failed": bg_status_map.get("failed", 0),
        },
    }


@router.get("/upload-trend")
def get_upload_trend(days: int = 30, db: Session = Depends(get_db)):
    """返回最近 N 天每日上传数量"""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(func.date(Material.created_at).label("date"), func.count(Material.id).label("count"))
        .filter(Material.created_at >= since)
        .group_by(func.date(Material.created_at))
        .order_by("date")
        .all()
    )
    return [{"date": str(date), "count": count} for date, count in rows]


@router.get("/recent")
def get_recent(limit: int = 10, db: Session = Depends(get_db)):
    materials = (
        db.query(Material)
        .order_by(Material.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": m.id,
            "filename": m.filename,
            "original_name": m.original_name,
            "category_name": m.category.name if m.category else "",
            "file_size": m.file_size,
            "created_at": m.created_at.isoformat(),
        }
        for m in materials
    ]