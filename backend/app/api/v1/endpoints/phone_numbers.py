"""
Phone Number Endpoints
CRUD operations for phone numbers
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.phone_number import PhoneNumber
from app.schemas.phone_number import PhoneNumberCreate, PhoneNumberUpdate, PhoneNumberResponse

router = APIRouter()


@router.post("", response_model=PhoneNumberResponse, status_code=status.HTTP_201_CREATED)
async def create_phone_number(
    phone_data: PhoneNumberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new phone number for current user"""
    new_phone = PhoneNumber(
        user_id=current_user.id,
        **phone_data.model_dump()
    )
    db.add(new_phone)
    await db.commit()
    await db.refresh(new_phone)
    return new_phone


@router.get("", response_model=List[PhoneNumberResponse])
async def get_phone_numbers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all phone numbers for current user"""
    result = await db.execute(
        select(PhoneNumber).where(PhoneNumber.user_id == current_user.id)
    )
    phone_numbers = result.scalars().all()
    return phone_numbers


@router.get("/{phone_id}", response_model=PhoneNumberResponse)
async def get_phone_number(
    phone_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific phone number by ID (must belong to current user)"""
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.user_id == current_user.id
        )
    )
    phone_number = result.scalar_one_or_none()
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    return phone_number


@router.put("/{phone_id}", response_model=PhoneNumberResponse)
async def update_phone_number(
    phone_id: int,
    phone_data: PhoneNumberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a phone number (must belong to current user)"""
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.user_id == current_user.id
        )
    )
    phone_number = result.scalar_one_or_none()
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    # Update fields
    update_data = phone_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(phone_number, field, value)
    
    await db.commit()
    await db.refresh(phone_number)
    return phone_number


@router.delete("/{phone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_phone_number(
    phone_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a phone number (must belong to current user)"""
    result = await db.execute(
        select(PhoneNumber).where(
            PhoneNumber.id == phone_id,
            PhoneNumber.user_id == current_user.id
        )
    )
    phone_number = result.scalar_one_or_none()
    
    if not phone_number:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not found"
        )
    
    await db.execute(delete(PhoneNumber).where(PhoneNumber.id == phone_id))
    await db.commit()
    return None

