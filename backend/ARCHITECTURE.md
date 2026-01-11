# AI Agent Orchestrator Architecture

This system is a 100% custom-built, modular AI Voice Agent platform designed for high-performance real-time interactions.

## 🏗️ Core Components

### 1. Agent Core (`app/services/agent/core.py`)
The orchestrator that manages the state machine, turn-taking, and ties all services together. It ensures synchronization between voice input, logic processing, and voice output.

### 2. Custom Brain (`app/services/agent/brain.py`)
A framework-free logic engine that uses LLMs (GPT-4o) to process instructions from a **Master Prompt**. It handles:
- **Personality/Tone Enforcement**: Ensures the agent follows the character defined in the prompt.
- **Intent Extraction**: Identifies if the user wants information, is complaining, or triggers an action.
- **Response Planning**: Plans the most concise and effective verbal response.

### 3. Voice Engine (`app/services/agent/voice.py`)
Handles the transformation between audio and text:
- **TTS (ElevenLabs)**: Real-time audio streaming with emotion/tone control.
- **STT (Whisper)**: Accurate transcription of user voice frames.

### 4. Memory Matrix (`app/services/agent/memory.py`)
Custom context management:
- **Short-term**: Session-based history for immediate conversation flow.
- **Long-term**: Persistent storage for user preferences and past interaction outcomes.

## 🔄 Conversation Flow (Real-time)
1. **Input**: User speaks -> Frontend opens WebSocket.
2. **STT**: Binary audio frames sent to `Agent_WS` -> Transcribed by `VoiceService`.
3. **Logic**: `AgentCore` invokes `AgentBrain` with Master Prompt + History.
4. **Planning**: `AgentBrain` generates response text and detects intents.
5. **Output**: `AgentCore` triggers `ElevenLabs` streaming -> Audio chunks sent back via WebSocket instantly.
6. **Closing**: Logic dictates if the call should end or wait for more input.

## 🛠️ Setup Instructions
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure `.env`:
   - `OPENAI_API_KEY`: For Brain (GPT-4o) and STT (Whisper).
   - `ELEVENLABS_API_KEY`: For TTS streaming.
4. Run the backend: `uvicorn main:app --reload`.
5. Connect your frontend to `ws://localhost:8000/api/v1/ws/agent/{agent_id}`.
