"""
Call Log Endpoints
CRUD operations for call logs
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.call_log import CallLog
from app.models.phone_number import PhoneNumber
from app.schemas.call_log import CallLogCreate, CallLogResponse

router = APIRouter()


@router.post("", response_model=CallLogResponse, status_code=status.HTTP_201_CREATED)
async def create_call_log(
    call_data: CallLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new call log for current user"""
    # Verify phone number belongs to user if provided
    if call_data.phone_number_id:
        phone_result = await db.execute(
            select(PhoneNumber).where(
                PhoneNumber.id == call_data.phone_number_id,
                PhoneNumber.user_id == current_user.id
            )
        )
        if not phone_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Phone number not found"
            )
    
    new_call = CallLog(
        user_id=current_user.id,
        **call_data.model_dump()
    )
    db.add(new_call)
    await db.commit()
    await db.refresh(new_call)
    return new_call


@router.get("", response_model=List[CallLogResponse])
async def get_call_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all call logs for current user with pagination"""
    result = await db.execute(
        select(CallLog)
        .where(CallLog.user_id == current_user.id)
        .order_by(desc(CallLog.timestamp))
        .offset(skip)
        .limit(limit)
    )
    call_logs = result.scalars().all()
    return call_logs


@router.get("/{call_id}", response_model=CallLogResponse)
async def get_call_log(
    call_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific call log by call_id (must belong to current user)"""
    result = await db.execute(
        select(CallLog).where(
            CallLog.call_id == call_id,
            CallLog.user_id == current_user.id
        )
    )
    call_log = result.scalar_one_or_none()
    
    if not call_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call log not found"
        )
    
    return call_log

