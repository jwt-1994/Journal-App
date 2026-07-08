from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Category

router = APIRouter(prefix="/api/categories", tags=["categories"])

PRESET_CATEGORIES = ["贴纸", "胶带", "印章", "便签", "背景纸"]


def init_preset_categories(db: Session):
    """首次启动时创建预设分类"""
    existing = db.query(Category).filter(Category.is_preset == True).count()
    if existing == 0:
        for name in PRESET_CATEGORIES:
            cat = Category(name=name, is_preset=True)
            db.add(cat)
        db.commit()


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "is_preset": c.is_preset,
            "material_count": len(c.materials),
            "created_at": c.created_at.isoformat(),
        }
        for c in categories
    ]


@router.post("")
def create_category(name: str, db: Session = Depends(get_db)):
    name = name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="分类名称不能为空")
    existing = db.query(Category).filter(Category.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="该分类已存在")
    cat = Category(name=name, is_preset=False)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "is_preset": cat.is_preset}


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="分类不存在")
    if cat.is_preset:
        raise HTTPException(status_code=400, detail="预设分类不可删除")
    if len(cat.materials) > 0:
        raise HTTPException(status_code=400, detail="该分类下还有素材，请先移走素材再删除")
    db.delete(cat)
    db.commit()
    return {"message": "删除成功"}