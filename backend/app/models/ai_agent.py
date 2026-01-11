"""
AI Agent Model
Stores AI agent configurations for each user (tenant)
Future: Integration with AI voice services
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class AIAgent(Base):
    __tablename__ = "ai_agents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String, nullable=False)
    system_prompt = Column(Text, nullable=False)  # System prompt for AI agent
    language = Column(String, default="en")  # Language code (e.g., en, hi, es)
    voice_name = Column(String, nullable=True)  # Future: Voice selection for AI
    is_active = Column(Boolean, default=True)
    configuration = Column(JSON, default={})  # Stores advanced config (flow, audio, behavior)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="ai_agents")
    agent_mappings = relationship("AgentPhoneMapping", back_populates="ai_agent", cascade="all, delete-orphan")

