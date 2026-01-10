"""
Agent-Phone Mapping Model
Links AI agents to phone numbers (many-to-many relationship)
One agent can be linked to multiple phone numbers
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class AgentPhoneMapping(Base):
    __tablename__ = "agent_phone_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)
    phone_number_id = Column(Integer, ForeignKey("phone_numbers.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    ai_agent = relationship("AIAgent", back_populates="agent_mappings")
    phone_number = relationship("PhoneNumber", back_populates="agent_mappings")
    
    # Ensure unique agent-phone combinations
    __table_args__ = (UniqueConstraint('agent_id', 'phone_number_id', name='uq_agent_phone'),)

