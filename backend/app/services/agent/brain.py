import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import settings

class AgentBrain:
    """
    Experimental Agent Brain: 100% custom-built logic engine.
    No LangChain, No AutoGPT. Pure Instruction Orchestration.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "gpt-4-turbo-preview"

    async def decide(self, 
                       user_input: str, 
                       history: List[Dict[str, str]], 
                       master_prompt: str,
                       context: Dict[str, Any] = {}) -> Dict[str, Any]:
        """
        Processes user input based on the Master Prompt and history.
        Implements custom intent detection and response planning.
        """
        
        # 1. Construct the Meta-System Instruction
        # We inject the Master Prompt as the core identity.
        system_instruction = f"""
ROLE: You are an AI Voice Agent.
MASTER INSTRUCTION: {master_prompt}

TASK: 
1. Analyze User Input.
2. Maintain character personality and rules.
3. If user preferences are in CONTEXT, use them.
4. If an action is required (Transfer, Appointment, etc.), include it in the response as '[ACTION: action_name]'.

CONTEXT: {context}

RULES:
- Be concise (voice interaction).
- Never break character.
- Handle interruptions gracefully.
"""

        if not self.client:
            return {
                "response": "Authentication Error: OpenAI API Key is missing. Please add it to your .env file.",
                "intent": "error"
            }

        messages = [{"role": "system", "content": system_instruction}]
        
        # Add conversation history
        for msg in history[-10:]: # Keep last 10 turns for token efficiency
            messages.append(msg)
            
        messages.append({"role": "user", "content": user_input})

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=250
            )
            
            content = response.choices[0].message.content
            
            # Simple Intent Extraction (Custom Logic)
            intent = "continue"
            if "[ACTION:" in content:
                intent = "action_required"
                
            return {
                "response": content,
                "intent": intent,
                "metadata": {
                    "tokens_used": response.usage.total_tokens,
                    "model": self.model
                }
            }
        except Exception as e:
            return {
                "response": "I'm having a bit of trouble processing that. Could you repeat it?",
                "intent": "error",
                "error": str(e)
            }

agent_brain = AgentBrain()
