"""
AI Agent Schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AIAgentCreate(BaseModel):
    agent_name: str
    system_prompt: str
    language: str = "en"
    voice_name: Optional[str] = None
    is_active: bool = True
    configuration: Optional[dict] = {}


class AIAgentUpdate(BaseModel):
    agent_name: Optional[str] = None
    system_prompt: Optional[str] = None
    language: Optional[str] = None
    voice_name: Optional[str] = None
    is_active: Optional[bool] = None
    configuration: Optional[dict] = None


class AIAgentResponse(BaseModel):
    id: int
    user_id: int
    agent_name: str
    system_prompt: str
    language: str
    voice_name: Optional[str]
    is_active: bool
    configuration: Optional[dict]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AgentPhoneLinkRequest(BaseModel):
    phone_number_ids: list[int]


