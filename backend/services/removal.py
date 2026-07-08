import os
import threading

from database import SessionLocal
from models import Material

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)


def _do_removal(material_id: int):
    """在后台线程中执行抠图"""
    db = SessionLocal()
    try:
        material = db.query(Material).filter(Material.id == material_id).first()
        if not material:
            return

        # 标记为处理中
        material.has_removed_bg = "processing"
        db.commit()

        # 执行抠图
        from rembg import new_session, remove
        from PIL import Image

        original_path = os.path.join(DATA_DIR, material.file_path)
        if not os.path.exists(original_path):
            material.has_removed_bg = "failed"
            db.commit()
            return

        input_image = Image.open(original_path)
        session = new_session("u2netp")
        output_image = remove(input_image, session=session)

        # 保存抠图结果（PNG 保留透明通道）
        base_name = os.path.splitext(material.filename)[0]
        output_filename = f"{base_name}_nobg.png"
        output_path = os.path.join(PROCESSED_DIR, output_filename)
        output_image.save(output_path, "PNG")

        # 更新数据库
        material.has_removed_bg = "done"
        material.removed_bg_path = os.path.join("processed", output_filename)
        db.commit()

    except Exception:
        try:
            material = db.query(Material).filter(Material.id == material_id).first()
            if material:
                material.has_removed_bg = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def trigger_removal_async(material_id: int):
    """异步触发抠图"""
    thread = threading.Thread(target=_do_removal, args=(material_id,), daemon=True)
    thread.start()