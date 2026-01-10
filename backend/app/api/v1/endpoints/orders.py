"""
Order Endpoints
CRUD operations for orders/data capture
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.order import Order
from app.models.call_log import CallLog
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new order for current user"""
    # Verify call_id belongs to user if provided
    if order_data.call_id:
        call_result = await db.execute(
            select(CallLog).where(
                CallLog.call_id == order_data.call_id,
                CallLog.user_id == current_user.id
            )
        )
        if not call_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Call log not found"
            )
    
    new_order = Order(
        user_id=current_user.id,
        **order_data.model_dump()
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    return new_order


@router.get("", response_model=List[OrderResponse])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all orders for current user with pagination"""
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(desc(Order.created_at))
        .offset(skip)
        .limit(limit)
    )
    orders = result.scalars().all()
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific order by ID (must belong to current user)"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: int,
    order_data: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an order (must belong to current user)"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Update fields
    update_data = order_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an order (must belong to current user)"""
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await db.execute(delete(Order).where(Order.id == order_id))
    await db.commit()
    return None

