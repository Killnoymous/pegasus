import asyncio
from typing import Dict, Any, Optional
from .brain import agent_brain
from .memory import agent_memory
from .voice import voice_service

class AgentCore:
    """
    The Orchestrator: Tying Brain, Voice, and Memory together.
    Modular and framework-free.
    """
    def __init__(self):
        pass

    async def process_turn(self, 
                             session_id: str, 
                             user_input: str, 
                             master_prompt: str,
                             user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a single workflow turn:
        STT (already handled) -> Brain Logic -> Memory Update -> TTS Trigger
        """
        
        # 1. Load context from Memory
        history = agent_memory.get_history(session_id)
        user_context = agent_memory.get_user_context(user_id) if user_id else {}

        # 2. Decision Engine (Brain)
        result = await agent_brain.decide(
            user_input=user_input,
            history=history,
            master_prompt=master_prompt,
            context=user_context
        )

        # 3. Handle Memory Update
        agent_memory.add_to_history(session_id, "user", user_input)
        agent_memory.add_to_history(session_id, "assistant", result["response"])

        # 4. Process Intents (Custom Logic)
        if result["intent"] == "action_required":
            # Logic to execute internal webhooks or functions could go here
            print(f"Action triggered in turn: {result['response']}")

        return {
            "text": result["response"],
            "intent": result["intent"]
        }

    async def generate_voice_response(self, text: str, voice_id: Optional[str] = None):
        """
        Stream binary audio chunks.
        """
        async for chunk in voice_service.stream_tts(text, voice_id=voice_id or "21m00Tcm4TlvDq8ikWAM"):
            yield chunk

agent_core = AgentCore()
