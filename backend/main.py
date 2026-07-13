import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.api import auth

app = FastAPI(
    title="TransitOps API Engine", 
    description="Custom Hackathon Core: FastAPI + PyJWT Authentication + Faker Mock Layer",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Register your API routes FIRST so they match before the catch-all frontend route
app.include_router(auth.router)

# Define path to the React frontend production build files
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.isdir(dist_dir):
    # 2. Mount assets folder specifically for JS/CSS bundles
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # 3. Use a catch-all route to serve the React index.html wrapper
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # Prevent intercepting the automated FastAPI documentation panels
        if catchall in ["docs", "redoc", "openapi.json"] or catchall.startswith("api/"):
            return None
        return FileResponse(os.path.join(dist_dir, "index.html"))

else:
    @app.get("/")
    def home():
        return {
            "status": "FastAPI Engine Active", 
            "docs_panel": "/docs", 
            "message": "Frontend build not found at frontend/dist"
        }