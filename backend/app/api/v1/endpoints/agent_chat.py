"""
Simple text chat endpoint for AI agents
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.models.ai_agent import AIAgent
from app.services.agent.brain import agent_brain

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    intent: str

@router.post("/{agent_id}/chat", response_model=ChatResponse)
async def chat_with_agent(
    agent_id: int,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Simple text chat with AI agent
    """
    # Get agent
    result = await db.execute(select(AIAgent).where(AIAgent.id == agent_id))
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get AI response
    ai_response = await agent_brain.decide(
        user_input=request.message,
        history=[],  # Simple mode - no history for now
        master_prompt=agent.system_prompt,
        context={}
    )
    
    return ChatResponse(
        response=ai_response["response"],
        intent=ai_response.get("intent", "continue")
    )
