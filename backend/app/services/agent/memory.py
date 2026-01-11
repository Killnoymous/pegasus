import json
import os
from typing import List, Dict, Any, Optional

class ConversationMemory:
    """
    100% Custom Memory Management.
    Handles Short-term (history) and Long-term (user prefs) memory.
    """
    def __init__(self, storage_path: str = "storage/memory"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)
        self.short_term: Dict[str, List[Dict[str, str]]] = {} # session_id -> history

    def add_to_history(self, session_id: str, role: str, content: str):
        if session_id not in self.short_term:
            self.short_term[session_id] = []
        self.short_term[session_id].append({"role": role, "content": content})

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.short_term.get(session_id, [])

    def clear_history(self, session_id: str):
        if session_id in self.short_term:
            del self.short_term[session_id]

    # --- Long Term Memory (Persistent) ---
    def save_preference(self, user_id: str, key: str, value: Any):
        path = os.path.join(self.storage_path, f"{user_id}.json")
        data = {}
        if os.path.exists(path):
            with open(path, "r") as f:
                data = json.load(f)
        
        data[key] = value
        with open(path, "w") as f:
            json.dump(data, f)

    def get_user_context(self, user_id: str) -> Dict[str, Any]:
        path = os.path.join(self.storage_path, f"{user_id}.json")
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
        return {}

agent_memory = ConversationMemory()
