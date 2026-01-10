"""
Order Schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class OrderCreate(BaseModel):
    call_id: Optional[str] = None
    customer_name: str
    phone: str
    order_details: Optional[str] = None
    address: Optional[str] = None


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    order_details: Optional[str] = None
    address: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    user_id: int
    call_id: Optional[str]
    customer_name: str
    phone: str
    order_details: Optional[str]
    address: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

