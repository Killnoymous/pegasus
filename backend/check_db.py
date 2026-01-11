import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User

async def check_user():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        print("Existing Users:")
        for u in users:
            print(f"- {u.email} (ID: {u.id})")

if __name__ == "__main__":
    asyncio.run(check_user())
