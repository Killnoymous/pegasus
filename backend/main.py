"""
FastAPI Application Entry Point
Multi-tenant AI Calling Platform Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Startup Error: {str(e)}")
    yield

app = FastAPI(
    title="AI Calling Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# SaaS-Ready CORS: Allowing flexible origins for testing and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily open to fix 400 errors
    allow_credentials=False, # Credentials must be False for wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Mount static directory for audio files
os.makedirs("static/audio", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"status": "online", "message": "AI SaaS Backend Active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
