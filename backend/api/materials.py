import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from database import get_db
from models import Material, Category
from services.removal import trigger_removal_async

router = APIRouter(prefix="/api/materials", tags=["materials"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data", "originals")


def save_upload_file(upload_file: UploadFile, category_name: str) -> str:
    """保存上传文件，返回相对路径"""
    ext = os.path.splitext(upload_file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="仅支持 JPG/PNG/WEBP 格式")

    category_dir = os.path.join(DATA_DIR, category_name)
    os.makedirs(category_dir, exist_ok=True)

    new_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(category_dir, new_filename)

    content = upload_file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="图片大小不能超过 20MB")

    with open(file_path, "wb") as f:
        f.write(content)

    return os.path.join("originals", category_name, new_filename)


@router.post("/upload")
def upload_material(
    file: UploadFile = File(...),
    category_id: int = Form(...),
    auto_remove_bg: bool = Form(True),
    name: str = Form(""),
    db: Session = Depends(get_db),
):
    # 校验分类
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="分类不存在")

    # 保存文件
    relative_path = save_upload_file(file, category.name)

    # 创建数据库记录
    content = open(os.path.join(DATA_DIR, "..", relative_path), "rb").read()
    material = Material(
        filename=os.path.basename(relative_path),
        original_name=name.strip() if name.strip() else file.filename,
        category_id=category_id,
        file_size=len(content),
        file_path=relative_path,
        created_at=datetime.now(timezone.utc),
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    # 异步触发抠图
    if auto_remove_bg:
        trigger_removal_async(material.id)

    return {
        "id": material.id,
        "filename": material.filename,
        "original_name": material.original_name,
        "category_id": material.category_id,
        "file_size": material.file_size,
        "has_removed_bg": material.has_removed_bg,
        "created_at": material.created_at.isoformat(),
    }


@router.post("/upload/batch")
def upload_materials_batch(
    files: list[UploadFile] = File(...),
    category_id: int = Form(...),
    auto_remove_bg: bool = Form(True),
    name: str = Form(""),
    db: Session = Depends(get_db),
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="分类不存在")

    results = []
    for file in files:
        try:
            relative_path = save_upload_file(file, category.name)
            file_path = os.path.join(DATA_DIR, "..", relative_path)
            content = open(file_path, "rb").read()
            material = Material(
                filename=os.path.basename(relative_path),
                original_name=name.strip() if name.strip() else file.filename,
                category_id=category_id,
                file_size=len(content),
                file_path=relative_path,
                created_at=datetime.now(timezone.utc),
            )
            db.add(material)
            db.commit()
            db.refresh(material)
            if auto_remove_bg:
                trigger_removal_async(material.id)
            results.append({"success": True, "id": material.id, "name": name.strip() or file.filename})
        except HTTPException as e:
            db.rollback()
            results.append({"success": False, "name": file.filename, "error": e.detail})
        except Exception as e:
            db.rollback()
            results.append({"success": False, "name": file.filename, "error": str(e)})

    return {"results": results}


@router.get("")
def list_materials(
    page: int = 1,
    page_size: int = 20,
    category_id: int | None = None,
    search: str | None = None,
    bg_status: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
):
    query = db.query(Material)
    if category_id is not None:
        query = query.filter(Material.category_id == category_id)

    # 搜索：按文件名模糊匹配
    if search:
        query = query.filter(Material.original_name.ilike(f"%{search}%"))

    # 抠图状态筛选
    if bg_status:
        query = query.filter(Material.has_removed_bg == bg_status)

    # 排序
    sort_col = Material.created_at
    if sort_by == "file_size":
        sort_col = Material.file_size
    sort_fn = desc if sort_order == "desc" else asc

    total = query.count()
    items = (
        query.order_by(sort_fn(sort_col))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": m.id,
                "filename": m.filename,
                "original_name": m.original_name,
                "category_id": m.category_id,
                "category_name": m.category.name if m.category else "",
                "file_size": m.file_size,
                "file_path": m.file_path,
                "has_removed_bg": m.has_removed_bg,
                "removed_bg_path": m.removed_bg_path,
                "created_at": m.created_at.isoformat(),
            }
            for m in items
        ],
    }


@router.post("/batch-remove-bg")
def batch_remove_bg(ids: list[int], db: Session = Depends(get_db)):
    """批量触发抠图"""
    materials = db.query(Material).filter(Material.id.in_(ids)).all()
    count = 0
    for m in materials:
        if m.has_removed_bg in ("none", "failed"):
            trigger_removal_async(m.id)
            count += 1
    return {"triggered": count, "total": len(ids)}


@router.post("/batch-delete")
def batch_delete(ids: list[int], db: Session = Depends(get_db)):
    """批量删除素材"""
    import os as _os
    BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATA = os.path.join(BASE, "data")

    materials = db.query(Material).filter(Material.id.in_(ids)).all()
    deleted = 0
    for m in materials:
        # 删除原图文件
        original_path = os.path.join(DATA, m.file_path)
        if _os.path.exists(original_path):
            _os.remove(original_path)
        # 删除抠图文件
        if m.removed_bg_path:
            removed_path = os.path.join(DATA, m.removed_bg_path)
            if _os.path.exists(removed_path):
                _os.remove(removed_path)
        db.delete(m)
        deleted += 1
    db.commit()
    return {"deleted": deleted, "total": len(ids)}