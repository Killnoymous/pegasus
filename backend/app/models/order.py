"""
Order Model
Stores order/data capture information for each user (tenant)
Linked to call logs for tracking
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    call_id = Column(String, ForeignKey("call_logs.call_id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    order_details = Column(Text, nullable=True)  # JSON string or text details
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    call_log = relationship("CallLog", back_populates="orders")

