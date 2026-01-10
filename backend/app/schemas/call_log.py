"""
Call Log Schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CallLogCreate(BaseModel):
    phone_number_id: Optional[int] = None
    call_id: str
    caller_number: str
    duration: float = 0.0
    status: str = "completed"


class CallLogResponse(BaseModel):
    id: int
    user_id: int
    phone_number_id: Optional[int]
    call_id: str
    caller_number: str
    duration: float
    status: str
    timestamp: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

