from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
from models import Base
from api.categories import router as categories_router, init_preset_categories
from api.materials import router as materials_router
from api.materials_detail import router as materials_detail_router
from api.dashboard import router as dashboard_router
from api.removal import router as removal_router
from api.backgrounds import router as backgrounds_router, init_preset_backgrounds
from api.collages import router as collages_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_preset_categories(db)
        init_preset_backgrounds(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Sticker Material API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories_router)
app.include_router(materials_router)
app.include_router(materials_detail_router)
app.include_router(dashboard_router)
app.include_router(removal_router)
app.include_router(backgrounds_router)
app.include_router(collages_router)


@app.get("/")
async def root():
    return {"message": "Sticker Material API is running"}