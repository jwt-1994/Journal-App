import os

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Material
from services.removal import trigger_removal_async

router = APIRouter(prefix="/api/materials", tags=["removal"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")


@router.get("/{material_id}/removal-status")
def get_removal_status(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return {"error": "素材不存在"}
    return {
        "material_id": material.id,
        "has_removed_bg": material.has_removed_bg,
        "removed_bg_path": material.removed_bg_path,
    }


@router.post("/{material_id}/retry-removal")
def retry_removal(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return {"error": "素材不存在"}
    if material.has_removed_bg == "processing":
        return {"error": "抠图正在处理中"}
    trigger_removal_async(material_id)
    return {"message": "已触发抠图", "material_id": material_id}


@router.get("/{material_id}/removed-file")
def get_removed_file(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return {"error": "素材不存在"}
    if material.has_removed_bg != "done" or not material.removed_bg_path:
        return {"error": "抠图结果不存在"}
    file_full_path = os.path.join(DATA_DIR, material.removed_bg_path)
    if not os.path.exists(file_full_path):
        return {"error": "文件不存在"}
    return FileResponse(file_full_path)