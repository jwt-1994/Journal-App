from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    is_preset = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    materials = relationship("Material", back_populates="category")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    has_removed_bg = Column(String, default="none", nullable=False)  # none/processing/done/failed
    removed_bg_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    category = relationship("Category", back_populates="materials")


class Background(Base):
    __tablename__ = "backgrounds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'preset' | 'user'
    color = Column(String, nullable=True)  # HEX color, null for texture types
    texture_path = Column(String, nullable=True)  # file path for texture, null for color types
    thumbnail_path = Column(String, nullable=True)
    width = Column(Integer, default=1920, nullable=False)
    height = Column(Integer, default=1080, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Collage(Base):
    __tablename__ = "collages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    background_id = Column(Integer, ForeignKey("backgrounds.id"), nullable=True)
    canvas_width = Column(Integer, default=1920, nullable=False)
    canvas_height = Column(Integer, default=1080, nullable=False)
    layout_data = Column(Text, nullable=False)  # JSON string
    preview_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)