"""
AI Agent Endpoints
CRUD operations for AI agents and phone number linking
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.ai_agent import AIAgent
from app.models.phone_number import PhoneNumber
from app.models.agent_phone_mapping import AgentPhoneMapping
from sqlalchemy import delete
from app.schemas.ai_agent import (
    AIAgentCreate, AIAgentUpdate, AIAgentResponse, AgentPhoneLinkRequest
)

router = APIRouter()


@router.post("", response_model=AIAgentResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_agent(
    agent_data: AIAgentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new AI agent for current user"""
    new_agent = AIAgent(
        user_id=current_user.id,
        **agent_data.model_dump()
    )
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)
    return new_agent


@router.get("", response_model=List[AIAgentResponse])
async def get_ai_agents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all AI agents for current user"""
    result = await db.execute(
        select(AIAgent).where(AIAgent.user_id == current_user.id)
    )
    agents = result.scalars().all()
    return agents


@router.get("/{agent_id}", response_model=AIAgentResponse)
async def get_ai_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific AI agent by ID (must belong to current user)"""
    result = await db.execute(
        select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.user_id == current_user.id
        )
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI agent not found"
        )
    
    return agent


@router.put("/{agent_id}", response_model=AIAgentResponse)
async def update_ai_agent(
    agent_id: int,
    agent_data: AIAgentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an AI agent (must belong to current user)"""
    result = await db.execute(
        select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.user_id == current_user.id
        )
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI agent not found"
        )
    
    # Update fields
    update_data = agent_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    
    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_agent(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an AI agent (must belong to current user)"""
    result = await db.execute(
        select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.user_id == current_user.id
        )
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI agent not found"
        )
    
    await db.execute(delete(AIAgent).where(AIAgent.id == agent_id))
    await db.commit()
    return None


@router.post("/{agent_id}/link-phones", status_code=status.HTTP_200_OK)
async def link_agent_to_phones(
    agent_id: int,
    link_data: AgentPhoneLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Link an AI agent to phone numbers (must belong to current user)"""
    # Verify agent belongs to user
    result = await db.execute(
        select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.user_id == current_user.id
        )
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI agent not found"
        )
    
    # Remove existing mappings for this agent
    await db.execute(
        delete(AgentPhoneMapping).where(AgentPhoneMapping.agent_id == agent_id)
    )
    
    # Verify all phone numbers belong to user and create new mappings
    for phone_id in link_data.phone_number_ids:
        phone_result = await db.execute(
            select(PhoneNumber).where(
                PhoneNumber.id == phone_id,
                PhoneNumber.user_id == current_user.id
            )
        )
        phone = phone_result.scalar_one_or_none()
        
        if not phone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Phone number {phone_id} not found"
            )
        
        # Create mapping
        mapping = AgentPhoneMapping(
            agent_id=agent_id,
            phone_number_id=phone_id
        )
        db.add(mapping)
    
    await db.commit()
    return {"message": "Agent linked to phone numbers successfully"}


@router.get("/{agent_id}/linked-phones", response_model=List[int])
async def get_linked_phones(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get phone numbers linked to an AI agent"""
    # Verify agent belongs to user
    result = await db.execute(
        select(AIAgent).where(
            AIAgent.id == agent_id,
            AIAgent.user_id == current_user.id
        )
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI agent not found"
        )
    
    # Get linked phone numbers
    mappings_result = await db.execute(
        select(AgentPhoneMapping).where(AgentPhoneMapping.agent_id == agent_id)
    )
    mappings = mappings_result.scalars().all()
    
    return [mapping.phone_number_id for mapping in mappings]

