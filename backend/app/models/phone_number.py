"""
Phone Number Model
Stores phone numbers associated with each user (tenant)
Future: Integration with Knowlarity DID
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class PhoneNumber(Base):
    __tablename__ = "phone_numbers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    number = Column(String, nullable=False)  # Phone number string (future: Knowlarity DID)
    provider = Column(String, default="Knowlarity")  # Provider name (e.g., Knowlarity)
    status = Column(String, default="active")  # active / inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="phone_numbers")
    agent_mappings = relationship("AgentPhoneMapping", back_populates="phone_number", cascade="all, delete-orphan")
    call_logs = relationship("CallLog", back_populates="phone_number")

