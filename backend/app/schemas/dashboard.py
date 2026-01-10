"""
Dashboard Schemas
Statistics and summary data
"""
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_phone_numbers: int
    active_phone_numbers: int
    total_ai_agents: int
    active_ai_agents: int
    total_calls: int
    total_orders: int

