"""
Phone Number Schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PhoneNumberCreate(BaseModel):
    number: str
    provider: str = "Knowlarity"
    status: str = "active"


class PhoneNumberUpdate(BaseModel):
    number: Optional[str] = None
    provider: Optional[str] = None
    status: Optional[str] = None


class PhoneNumberResponse(BaseModel):
    id: int
    user_id: int
    number: str
    provider: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

