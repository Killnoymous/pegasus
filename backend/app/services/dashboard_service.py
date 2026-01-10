"""
Dashboard Service
Business logic for dashboard statistics
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.phone_number import PhoneNumber
from app.models.ai_agent import AIAgent
from app.models.call_log import CallLog
from app.models.order import Order
from app.schemas.dashboard import DashboardStats


async def get_dashboard_stats(db: AsyncSession, user_id: int) -> DashboardStats:
    """Get dashboard statistics for a user"""
    # Total phone numbers
    total_phones_result = await db.execute(
        select(func.count(PhoneNumber.id)).where(PhoneNumber.user_id == user_id)
    )
    total_phone_numbers = total_phones_result.scalar() or 0
    
    # Active phone numbers
    active_phones_result = await db.execute(
        select(func.count(PhoneNumber.id)).where(
            PhoneNumber.user_id == user_id,
            PhoneNumber.status == "active"
        )
    )
    active_phone_numbers = active_phones_result.scalar() or 0
    
    # Total AI agents
    total_agents_result = await db.execute(
        select(func.count(AIAgent.id)).where(AIAgent.user_id == user_id)
    )
    total_ai_agents = total_agents_result.scalar() or 0
    
    # Active AI agents
    active_agents_result = await db.execute(
        select(func.count(AIAgent.id)).where(
            AIAgent.user_id == user_id,
            AIAgent.is_active == True
        )
    )
    active_ai_agents = active_agents_result.scalar() or 0
    
    # Total calls
    total_calls_result = await db.execute(
        select(func.count(CallLog.id)).where(CallLog.user_id == user_id)
    )
    total_calls = total_calls_result.scalar() or 0
    
    # Total orders
    total_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.user_id == user_id)
    )
    total_orders = total_orders_result.scalar() or 0
    
    return DashboardStats(
        total_phone_numbers=total_phone_numbers,
        active_phone_numbers=active_phone_numbers,
        total_ai_agents=total_ai_agents,
        active_ai_agents=active_ai_agents,
        total_calls=total_calls,
        total_orders=total_orders
    )

