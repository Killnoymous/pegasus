from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.services.agent.core import agent_core
from app.services.agent.voice import voice_service
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ai_agent import AIAgent
import asyncio
import json

router = APIRouter()

@router.websocket("/ws/agent/{agent_id}")
async def agent_websocket(websocket: WebSocket, agent_id: int):
    """
    Production-ready WebSocket for real-time AI Voice interaction.
    Handles: STT -> Brain -> TTS Streaming.
    """
    await websocket.accept()
    session_id = f"ws_{agent_id}"

    # Database fetching logic
    # We use a context manager for the DB session since it's inside a WebSocket loop
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AIAgent).where(AIAgent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            await websocket.send_json({"error": "Agent not found"})
            await websocket.close()
            return
        master_prompt = agent.system_prompt
    
    try:
        while True:
            # 1. Wait for Audio Data (Binary)
            data = await websocket.receive_bytes()
            
            # 2. Transcribe (STT)
            user_text = await voice_service.transcribe_audio(data)
            if not user_text:
                continue
                
            # Send transcript back to UI for visibility
            await websocket.send_json({"type": "transcript", "role": "user", "text": user_text})

            # 3. Process Logic (Brain Core)
            agent_result = await agent_core.process_turn(
                session_id=session_id,
                user_input=user_text,
                master_prompt=master_prompt
            )
            
            # Send agent text response
            await websocket.send_json({"type": "transcript", "role": "assistant", "text": agent_result["text"]})

            # 4. Stream Audio (TTS)
            # We send audio chunks as binary frames
            async for chunk in agent_core.generate_voice_response(agent_result["text"]):
                await websocket.send_bytes(chunk)
                
            # Signal end of turn
            await websocket.send_json({"type": "status", "value": "turn_complete"})

    except WebSocketDisconnect:
        print(f"Agent {agent_id} disconnected.")
    except Exception as e:
        print(f"WS Error: {str(e)}")
        await websocket.close()
