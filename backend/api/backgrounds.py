import os
import uuid
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from PIL import Image
from sqlalchemy.orm import Session

from database import get_db, DATA_DIR
from models import Background

router = APIRouter(prefix="/api/backgrounds", tags=["backgrounds"])

BACKGROUNDS_DIR = os.path.join(DATA_DIR, "backgrounds")
THUMBNAILS_DIR = os.path.join(BACKGROUNDS_DIR, "thumbnails")
PRESETS_DIR = os.path.join(BACKGROUNDS_DIR, "presets")

os.makedirs(THUMBNAILS_DIR, exist_ok=True)
os.makedirs(PRESETS_DIR, exist_ok=True)

# 预设纯色配色
PRESET_COLORS = [
    ("纯白", "#FFFFFF"),
    ("米白", "#FAF8F5"),
    ("浅粉", "#FFE4E1"),
    ("樱花粉", "#FFB7C5"),
    ("浅蓝", "#E0F0FF"),
    ("天空蓝", "#B3D9FF"),
    ("牛油果绿", "#E8F5E9"),
    ("薄荷绿", "#C8E6C9"),
    ("奶油黄", "#FFF9C4"),
    ("薰衣草紫", "#F3E5F5"),
    ("浅灰", "#F5F5F5"),
    ("暖灰", "#E8E5E0"),
    ("卡其", "#F5F0E8"),
    ("蜜桃", "#FFDAB9"),
    ("浅杏", "#FFE5CC"),
    ("淡茶", "#EFEBE9"),
    ("雾蓝", "#D6E4F0"),
    ("藕粉", "#F0E0E0"),
    ("奶绿", "#E8ECD6"),
    ("浅橙", "#FFE0B2"),
]

PRESET_TEXTURES = [
    ("牛皮纸", "kraft"),
    ("网格", "grid"),
    ("水彩", "watercolor"),
    ("布纹", "fabric"),
    ("木纹", "wood"),
    ("大理石", "marble"),
    ("点阵", "dots"),
    ("方格", "squares"),
    ("横线", "lines"),
    ("空白", "blank"),
]


def _generate_color_image(hex_color: str, width: int, height: int) -> Image.Image:
    return Image.new("RGB", (width, height), hex_color)


def _generate_texture_image(texture_type: str, width: int, height: int) -> Image.Image:
    """Generate procedural texture images."""
    from PIL import ImageDraw, ImageFilter
    import random
    random.seed(42)

    img = Image.new("RGB", (width, height), "#FAF8F5")
    draw = ImageDraw.Draw(img)

    if texture_type == "kraft":
        # 牛皮纸：暖棕色基底 + 噪点
        bg_color = (210, 180, 140)
        img = Image.new("RGB", (width, height), bg_color)
        for _ in range(20000):
            x = random.randint(0, width - 1)
            y = random.randint(0, height - 1)
            noise = random.randint(-20, 20)
            r = max(0, min(255, bg_color[0] + noise))
            g = max(0, min(255, bg_color[1] + noise))
            b = max(0, min(255, bg_color[2] + noise))
            draw.point((x, y), fill=(r, g, b))

    elif texture_type == "grid":
        # 网格：浅灰线
        img = Image.new("RGB", (width, height), "#FFFFFF")
        grid_size = 40
        for x in range(0, width, grid_size):
            draw.line([(x, 0), (x, height)], fill="#E8E8E8", width=1)
        for y in range(0, height, grid_size):
            draw.line([(0, y), (width, y)], fill="#E8E8E8", width=1)

    elif texture_type == "watercolor":
        # 水彩：柔和的色彩混合
        img = Image.new("RGB", (width, height), "#FFFFFF")
        for _ in range(500):
            x = random.randint(0, width)
            y = random.randint(0, height)
            r = random.randint(100, 255)
            g = random.randint(100, 255)
            b = random.randint(150, 255)
            radius = random.randint(30, 120)
            draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=(r, g, b, 10))
        img = img.filter(ImageFilter.GaussianBlur(radius=30))

    elif texture_type == "fabric":
        # 布纹：交叉纹理
        img = Image.new("RGB", (width, height), "#F5F0EB")
        for y in range(0, height, 4):
            for x in range(0, width, 4):
                if (x + y) % 8 == 0:
                    draw.point((x, y), fill="#E8E0D5")
        for x in range(0, width, 6):
            draw.line([(x, 0), (x, height)], fill="#EDE5DD", width=1)
        for y in range(0, height, 6):
            draw.line([(0, y), (width, y)], fill="#EDE5DD", width=1)

    elif texture_type == "wood":
        # 木纹：横向条纹
        img = Image.new("RGB", (width, height), "#DEB887")
        for y in range(0, height, 3):
            shade = random.randint(-15, 15)
            r = max(0, min(255, 222 + shade))
            g = max(0, min(255, 184 + shade))
            b = max(0, min(255, 135 + shade))
            draw.line([(0, y), (width, y)], fill=(r, g, b), width=2)

    elif texture_type == "marble":
        # 大理石：浅灰基底 + 深色纹理
        img = Image.new("RGB", (width, height), "#F0F0F0")
        for _ in range(2000):
            x = random.randint(0, width)
            y = random.randint(0, height)
            shade = random.randint(0, 60)
            draw.ellipse([x - 50, y - 2, x + 50, y + 2], fill=(200 - shade, 200 - shade, 200 - shade))
        img = img.filter(ImageFilter.GaussianBlur(radius=2))

    elif texture_type == "dots":
        # 点阵
        img = Image.new("RGB", (width, height), "#FFFFFF")
        spacing = 30
        for x in range(spacing, width, spacing):
            for y in range(spacing, height, spacing):
                draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill="#D0D0D0")

    elif texture_type == "squares":
        # 方格笔记本
        img = Image.new("RGB", (width, height), "#FFFFF0")
        square_size = 25
        for x in range(0, width, square_size):
            draw.line([(x, 0), (x, height)], fill="#B0D0FF", width=1)
        for y in range(0, height, square_size):
            draw.line([(0, y), (width, y)], fill="#B0D0FF", width=1)

    elif texture_type == "lines":
        # 横线笔记本
        img = Image.new("RGB", (width, height), "#FFFFF0")
        line_spacing = 30
        for y in range(line_spacing, height, line_spacing):
            draw.line([(0, y), (width, y)], fill="#B0D0FF", width=1)

    elif texture_type == "blank":
        # 空白
        img = Image.new("RGB", (width, height), "#FFFFFF")

    return img


def _save_and_thumbnail(img: Image.Image, name: str, image_type: str, subdir: str = "") -> dict:
    """Save full image and thumbnail, return paths."""
    safe_name = f"{uuid.uuid4().hex[:8]}_{name}"
    if subdir:
        save_dir = os.path.join(BACKGROUNDS_DIR, subdir)
        os.makedirs(save_dir, exist_ok=True)
    else:
        save_dir = BACKGROUNDS_DIR

    # Save full image
    full_path = os.path.join(save_dir, f"{safe_name}.png")
    img.save(full_path, "PNG")

    # Save thumbnail
    thumb = img.copy()
    thumb.thumbnail((320, 180))
    thumb_path = os.path.join(THUMBNAILS_DIR, f"{safe_name}_thumb.png")
    thumb.save(thumb_path, "PNG")

    return {
        "texture_path": full_path if image_type == "texture" else None,
        "color": None if image_type == "texture" else img.getpixel((0, 0)),
        "thumbnail_path": thumb_path,
    }


def init_preset_backgrounds(db: Session):
    """首次启动时初始化内置背景模版"""
    existing = db.query(Background).filter(Background.type == "preset").count()
    if existing > 0:
        return

    for name, hex_color in PRESET_COLORS:
        img = _generate_color_image(hex_color, 1920, 1080)
        paths = _save_and_thumbnail(img, name, "color", "presets")
        bg = Background(
            name=name,
            type="preset",
            color=hex_color,
            thumbnail_path=paths["thumbnail_path"],
            width=1920,
            height=1080,
        )
        db.add(bg)

    for name, texture_type in PRESET_TEXTURES:
        img = _generate_texture_image(texture_type, 1920, 1080)
        paths = _save_and_thumbnail(img, name, "texture", "presets")
        bg = Background(
            name=name,
            type="preset",
            texture_path=paths["texture_path"],
            thumbnail_path=paths["thumbnail_path"],
            width=1920,
            height=1080,
        )
        db.add(bg)

    db.commit()


@router.get("")
def list_backgrounds(type: str = None, db: Session = Depends(get_db)):
    query = db.query(Background)
    if type:
        query = query.filter(Background.type == type)
    backgrounds = query.order_by(Background.type, Background.name).all()
    return [
        {
            "id": b.id,
            "name": b.name,
            "type": b.type,
            "color": b.color,
            "texture_path": b.texture_path,
            "thumbnail_path": b.thumbnail_path,
            "width": b.width,
            "height": b.height,
            "created_at": b.created_at.isoformat(),
        }
        for b in backgrounds
    ]


@router.post("")
async def create_background(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="请上传图片文件")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过 5MB")

    img = Image.open(BytesIO(contents))
    if img.mode != "RGB":
        img = img.convert("RGB")

    # 缩放至标准尺寸
    img = img.resize((1920, 1080), Image.LANCZOS)

    name = os.path.splitext(file.filename or "background")[0]
    paths = _save_and_thumbnail(img, name, "texture", "user")

    bg = Background(
        name=name,
        type="user",
        texture_path=paths["texture_path"],
        thumbnail_path=paths["thumbnail_path"],
        width=1920,
        height=1080,
    )
    db.add(bg)
    db.commit()
    db.refresh(bg)
    return {
        "id": bg.id,
        "name": bg.name,
        "type": bg.type,
        "thumbnail_path": bg.thumbnail_path,
        "width": bg.width,
        "height": bg.height,
    }


@router.delete("/{background_id}")
def delete_background(background_id: int, db: Session = Depends(get_db)):
    bg = db.query(Background).filter(Background.id == background_id).first()
    if not bg:
        raise HTTPException(status_code=404, detail="背景不存在")
    if bg.type == "preset":
        raise HTTPException(status_code=400, detail="内置背景不可删除")

    # 删除文件
    if bg.texture_path and os.path.exists(bg.texture_path):
        os.remove(bg.texture_path)
    if bg.thumbnail_path and os.path.exists(bg.thumbnail_path):
        os.remove(bg.thumbnail_path)

    db.delete(bg)
    db.commit()
    return {"message": "删除成功"}


@router.get("/{background_id}/file")
def get_background_file(background_id: int, db: Session = Depends(get_db)):
    bg = db.query(Background).filter(Background.id == background_id).first()
    if not bg:
        raise HTTPException(status_code=404, detail="背景不存在")

    if bg.color:
        # 纯色背景：动态生成
        img = _generate_color_image(bg.color, bg.width, bg.height)
        buf = BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        from fastapi.responses import StreamingResponse
        return StreamingResponse(buf, media_type="image/png")

    if bg.texture_path:
        if os.path.exists(bg.texture_path):
            return FileResponse(bg.texture_path, media_type="image/png")
        raise HTTPException(status_code=404, detail="背景文件不存在")

    raise HTTPException(status_code=404, detail="无可用的背景文件")