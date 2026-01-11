import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

# Explicitly load the .env file from the backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    print(f"DEBUG: Loading .env from {env_path}")
    load_dotenv(env_path, override=True)
else:
    print(f"DEBUG: .env file not found at {env_path}")

from sqlalchemy import text, inspect
from app.core.config import settings

print(f"DEBUG: DATABASE_URL from settings: {settings.DATABASE_URL}")

from app.core.database import engine, Base
# Import models to ensure they are registered with Base
from app.models.ai_agent import AIAgent
from app.models.user import User  # Assuming User model exists and is needed due to ForeignKey

async def migrate():
    print("Checking database schema...")
    async with engine.begin() as conn:
        # Check if table exists
        def check_table_exists(sync_conn):
            inspector = inspect(sync_conn)
            return inspector.has_table("ai_agents")

        table_exists = await conn.run_sync(check_table_exists)

        if not table_exists:
            print("Table 'ai_agents' does not exist. Creating all tables...")
            await conn.run_sync(Base.metadata.create_all)
            print("✓ SUCCESS: Database tables created.")
            return

        print("Table 'ai_agents' exists. Attempting to add 'configuration' column...")
        try:
            # We use a generic SQL command that works for both Postgres and SQLite (mostly)
            # Note: SQLite has limited ALTER TABLE support but ADD COLUMN is supported.
            await conn.execute(text("ALTER TABLE ai_agents ADD COLUMN configuration JSON DEFAULT '{}'"))
            print("✓ SUCCESS: 'configuration' column added.")
        except Exception as e:
            # Convert to string to check for specific error messages without depending on extensive library imports
            err_str = str(e).lower()
            if "duplicate column" in err_str or "already exists" in err_str:
                print("! NOTE: Column 'configuration' already exists. No changes needed.")
            else:
                print(f"X ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
