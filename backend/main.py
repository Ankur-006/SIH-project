"""
MailGuard - Backend API
FastAPI entrypoint with CORS, route registration, and health check.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from config import CORS_ORIGINS, PORT, HOST
from routers.analyze import router as analyze_router
from routers.geolocation import router as geo_router
from routers.cases import router as cases_router
from routers.reports import router as reports_router
from routers.inbox import router as inbox_router
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.search import router as search_router
from routers.notifications import router as notif_router
from routers.audit import router as audit_router
from routers.settings import router as settings_router
from routers.dashboard import router as dashboard_router
from routers.domain import router as domain_router
from routers.url import router as url_router
from data.database import seed_default_data

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    seed_default_data()
    yield

app = FastAPI(
    title="MailGuard Forensic Intelligence API",
    description="Backend API for email threat detection, header parsing, NLP analysis, and geolocation intelligence.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(search_router)
app.include_router(notif_router)
app.include_router(audit_router)
app.include_router(settings_router)
app.include_router(dashboard_router)
app.include_router(domain_router)
app.include_router(url_router)
app.include_router(analyze_router)
app.include_router(geo_router)
app.include_router(cases_router)
app.include_router(reports_router)
app.include_router(inbox_router)


@app.get("/api/health")
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "MailGuard Forensic Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
