"""
Dashboard Endpoints
Statistics and summary data
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.dashboard_service import get_dashboard_stats

router = APIRouter()


@router.get("/stats")
async def get_dashboard_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics for current user"""
    stats = await get_dashboard_stats(db, current_user.id)
    return stats

