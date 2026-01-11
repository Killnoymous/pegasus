import os
import httpx
import json
import base64
from typing import Optional, AsyncGenerator
from app.core.config import settings

class VoiceService:
    """
    Modular Voice Engine: STT and TTS (ElevenLabs).
    Clean, replaceable interface.
    """
    def __init__(self, elevenlabs_key: Optional[str] = None):
        self.elevenlabs_key = elevenlabs_key or settings.ELEVENLABS_API_KEY
        self.tts_url = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        
    async def stream_tts(self, text: str, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> AsyncGenerator[bytes, None]:
        """
        Streams audio from ElevenLabs for the given text.
        """
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.elevenlabs_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        async with httpx.AsyncClient() as client:
            url = self.tts_url.format(voice_id=voice_id)
            async with client.stream("POST", url, json=data, headers=headers) as response:
                if response.status_code != 200:
                    error_msg = await response.aread()
                    print(f"ElevenLabs Error: {error_msg}")
                    return
                
                async for chunk in response.aiter_bytes():
                    yield chunk

    async def transcribe_audio(self, audio_data: bytes) -> str:
        """
        Transcribes binary audio data using Whisper (OpenAI API).
        Modular: Can be swapped with self-hosted Whisper.
        """
        # Save temp file for OpenAI Whisper API (expects file object)
        temp_file = "temp_audio.wav"
        with open(temp_file, "wb") as f:
            f.write(audio_data)
            
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            if not settings.OPENAI_API_KEY:
                return "Error: OpenAI API Key missing."
            
            with open(temp_file, "rb") as audio:
                transcript = await client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio
                )
            return transcript.text
        except Exception as e:
            print(f"STT Error: {str(e)}")
            return ""
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)

voice_service = VoiceService()
