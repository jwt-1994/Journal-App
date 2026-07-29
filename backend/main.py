from fastapi import FastAPI, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove
from PIL import Image
from io import BytesIO
import uvicorn
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rembg")

app = FastAPI(title="Remove-BG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info(f"{request.method} {request.url.path} <- {request.client.host} ({duration:.2f}s) {response.status_code}")
    return response

@app.post("/api/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    t0 = time.time()
    contents = await file.read()
    logger.info(f"收到图片: {file.filename}, {len(contents)} bytes")
    img = Image.open(BytesIO(contents))
    logger.info(f"图片尺寸: {img.size}, 模式: {img.mode}")
    result = remove(img)
    buf = BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    logger.info(f"抠图完成, 耗时: {time.time() - t0:.2f}s")
    return Response(content=buf.read(), media_type="image/png")

@app.get("/")
async def root():
    return {"message": "Remove-BG Service is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)