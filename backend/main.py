from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from rembg import remove
from PIL import Image
from io import BytesIO
import uvicorn

app = FastAPI(title="Remove-BG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(BytesIO(contents))
    result = remove(img)
    buf = BytesIO()
    result.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.read(), media_type="image/png")

@app.get("/")
async def root():
    return {"message": "Remove-BG Service is running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)