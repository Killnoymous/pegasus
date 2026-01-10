"""
User Schemas
"""
from pydantic import BaseModel
from datetime import datetime


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

