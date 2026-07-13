from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

import os
from fastapi.staticfiles import StaticFiles

app.include_router(auth.router)

# Serve React frontend if dist exists
dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(dist_dir):
    app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")
else:
    @app.get("/")
    def home():
        return {"status": "FastAPI Engine Active", "docs_panel": "/docs", "message": "Frontend build not found at frontend/dist"}