from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.ai_service import ai_service
import os

router = APIRouter()

class TestConversationRequest(BaseModel):
    user_input: str
    system_prompt: str = "You are a helpful AI assistant."

@router.post("/speak")
async def test_speak(request: TestConversationRequest):
    """
    Test endpoint to verify Gemini + Edge TTS integration.
    1. Sends user_input to Gemini.
    2. Converts Gemini's response to speech using Edge TTS.
    3. Returns the audio file.
    """
    # 1. Generate text response
    ai_response = await ai_service.generate_response(request.user_input, request.system_prompt)
    
    if ai_response.startswith("Error"):
        raise HTTPException(status_code=500, detail=ai_response)
        
    # 2. Convert to speech
    audio_path = await ai_service.text_to_speech(ai_response)
    
    if not audio_path or not os.path.exists(audio_path):
        raise HTTPException(status_code=500, detail="Failed to generate audio")
        
    # 3. Return audio file
    return FileResponse(audio_path, media_type="audio/mpeg", filename="response.mp3")

@router.post("/echo-speak")
async def test_echo_speak(text: str):
    """
    Simple endpoint to test ONLY TTS (Text-to-Speech).
    """
    audio_path = await ai_service.text_to_speech(text)
    
    if not audio_path or not os.path.exists(audio_path):
        raise HTTPException(status_code=500, detail="Failed to generate audio")
        
    return FileResponse(audio_path, media_type="audio/mpeg", filename="echo.mp3")
