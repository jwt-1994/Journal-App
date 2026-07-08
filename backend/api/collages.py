import os
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from database import get_db, DATA_DIR
from models import Collage

router = APIRouter(prefix="/api/collages", tags=["collages"])

COLLAGES_DIR = os.path.join(DATA_DIR, "collages")
os.makedirs(COLLAGES_DIR, exist_ok=True)


@router.get("")
def list_collages(db: Session = Depends(get_db)):
    collages = db.query(Collage).order_by(Collage.updated_at.desc()).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "background_id": c.background_id,
            "canvas_width": c.canvas_width,
            "canvas_height": c.canvas_height,
            "layout_data": json.loads(c.layout_data),
            "preview_path": c.preview_path,
            "created_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        }
        for c in collages
    ]


@router.post("")
def create_collage(
    name: str = Body(...),
    background_id: int = Body(None),
    canvas_width: int = Body(1920),
    canvas_height: int = Body(1080),
    layout_data: list = Body(default=[]),
    db: Session = Depends(get_db),
):
    collage = Collage(
        name=name.strip(),
        background_id=background_id,
        canvas_width=canvas_width,
        canvas_height=canvas_height,
        layout_data=json.dumps(layout_data, ensure_ascii=False),
    )
    db.add(collage)
    db.commit()
    db.refresh(collage)
    return {
        "id": collage.id,
        "name": collage.name,
        "background_id": collage.background_id,
        "canvas_width": collage.canvas_width,
        "canvas_height": collage.canvas_height,
        "layout_data": json.loads(collage.layout_data),
        "created_at": collage.created_at.isoformat(),
        "updated_at": collage.updated_at.isoformat(),
    }


@router.get("/{collage_id}")
def get_collage(collage_id: int, db: Session = Depends(get_db)):
    collage = db.query(Collage).filter(Collage.id == collage_id).first()
    if not collage:
        raise HTTPException(status_code=404, detail="拼贴方案不存在")
    return {
        "id": collage.id,
        "name": collage.name,
        "background_id": collage.background_id,
        "canvas_width": collage.canvas_width,
        "canvas_height": collage.canvas_height,
        "layout_data": json.loads(collage.layout_data),
        "preview_path": collage.preview_path,
        "created_at": collage.created_at.isoformat(),
        "updated_at": collage.updated_at.isoformat(),
    }


@router.put("/{collage_id}")
def update_collage(
    collage_id: int,
    name: str = Body(None),
    background_id: int = Body(None),
    layout_data: list = Body(None),
    preview_path: str = Body(None),
    db: Session = Depends(get_db),
):
    collage = db.query(Collage).filter(Collage.id == collage_id).first()
    if not collage:
        raise HTTPException(status_code=404, detail="拼贴方案不存在")

    if name is not None:
        collage.name = name.strip()
    if background_id is not None:
        collage.background_id = background_id
    if layout_data is not None:
        collage.layout_data = json.dumps(layout_data, ensure_ascii=False)
    if preview_path is not None:
        collage.preview_path = preview_path
    collage.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(collage)
    return {
        "id": collage.id,
        "name": collage.name,
        "background_id": collage.background_id,
        "canvas_width": collage.canvas_width,
        "canvas_height": collage.canvas_height,
        "layout_data": json.loads(collage.layout_data),
        "preview_path": collage.preview_path,
        "created_at": collage.created_at.isoformat(),
        "updated_at": collage.updated_at.isoformat(),
    }


@router.delete("/{collage_id}")
def delete_collage(collage_id: int, db: Session = Depends(get_db)):
    collage = db.query(Collage).filter(Collage.id == collage_id).first()
    if not collage:
        raise HTTPException(status_code=404, detail="拼贴方案不存在")

    # 删除预览图
    if collage.preview_path and os.path.exists(collage.preview_path):
        os.remove(collage.preview_path)

    db.delete(collage)
    db.commit()
    return {"message": "删除成功"}