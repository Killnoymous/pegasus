"""
Call Log Model
Stores call records for each user (tenant)
Future: Integration with SIP/telephony webhooks
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class CallLog(Base):
    __tablename__ = "call_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number_id = Column(Integer, ForeignKey("phone_numbers.id", ondelete="SET NULL"), nullable=True)
    call_id = Column(String, unique=True, index=True, nullable=False)  # Unique call identifier
    caller_number = Column(String, nullable=False)  # Phone number of the caller
    duration = Column(Float, default=0.0)  # Call duration in seconds
    status = Column(String, default="completed")  # completed, failed, missed, etc.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="call_logs")
    phone_number = relationship("PhoneNumber", back_populates="call_logs")
    orders = relationship("Order", back_populates="call_log")

