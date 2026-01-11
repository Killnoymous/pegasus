"""
Main API Router
Aggregates all endpoint routers
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, phone_numbers, ai_agents, call_logs, orders, dashboard, agent_ws

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(phone_numbers.router, prefix="/phone-numbers", tags=["Phone Numbers"])
api_router.include_router(ai_agents.router, prefix="/ai-agents", tags=["AI Agents"])
api_router.include_router(call_logs.router, prefix="/call-logs", tags=["Call Logs"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])

from app.api.v1.endpoints import test_ai
api_router.include_router(test_ai.router, prefix="/test-ai", tags=["Test AI"])
api_router.include_router(agent_ws.router, tags=["Agent WebSocket"])

