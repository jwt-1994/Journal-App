import os

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Material

router = APIRouter(prefix="/api/materials", tags=["materials-detail"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")


@router.get("/{material_id}")
def get_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return {"error": "素材不存在"}
    return {
        "id": material.id,
        "filename": material.filename,
        "original_name": material.original_name,
        "category_id": material.category_id,
        "category_name": material.category.name if material.category else "",
        "file_size": material.file_size,
        "file_path": material.file_path,
        "has_removed_bg": material.has_removed_bg,
        "removed_bg_path": material.removed_bg_path,
        "created_at": material.created_at.isoformat(),
    }


@router.get("/{material_id}/file")
def get_material_file(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return {"error": "素材不存在"}
    file_full_path = os.path.join(DATA_DIR, material.file_path)
    if not os.path.exists(file_full_path):
        return {"error": "文件不存在"}
    return FileResponse(file_full_path)


@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        return {"error": "素材不存在"}

    # 删除原图文件
    file_full_path = os.path.join(DATA_DIR, material.file_path)
    if os.path.exists(file_full_path):
        os.remove(file_full_path)

    # 删除抠图文件
    if material.removed_bg_path:
        removed_path = os.path.join(DATA_DIR, material.removed_bg_path)
        if os.path.exists(removed_path):
            os.remove(removed_path)

    # 删除数据库记录
    db.delete(material)
    db.commit()
    return {"message": "删除成功"}