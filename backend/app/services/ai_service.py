import google.generativeai as genai
import edge_tts
import uuid
import os
from app.core.config import settings

# Configure Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class AIService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro') if settings.GEMINI_API_KEY else None

    async def generate_response(self, user_input: str, system_prompt: str = "You are a helpful assistant.") -> str:
        """
        Generates a text response using Google Gemini.
        """
        if not self.model:
            return "Error: Gemini API Key is missing. Please check your .env file."
        
        try:
            # Construct a simple prompt with system instruction
            # Gemini-pro via API is chat-optimized, but we can structure the prompt
            full_prompt = f"{system_prompt}\n\nUser: {user_input}\nAssistant:"
            
            response = await self.model.generate_content_async(full_prompt)
            return response.text
        except Exception as e:
            return f"Error generating response: {str(e)}"

    async def text_to_speech(self, text: str, voice: str = "en-US-AriaNeural") -> str:
        """
        Converts text to speech using Edge TTS and returns the path to the temporary audio file.
        """
        try:
            # Create a unique filename for the audio
            filename = f"speech_{uuid.uuid4()}.mp3"
            # Ensure a static directory exists for serving files (we might need to adjust this path)
            output_dir = "static/audio"
            os.makedirs(output_dir, exist_ok=True)
            
            output_path = os.path.join(output_dir, filename)
            
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            
            return output_path
        except Exception as e:
            print(f"TTS Error: {str(e)}")
            return ""

ai_service = AIService()
