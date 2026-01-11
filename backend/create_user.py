import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_demo_user():
    email = "kakupro009@gmail.com"
    password = "Kaku@009"
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            hashed_password = get_password_hash(password)
            new_user = User(
                email=email,
                hashed_password=hashed_password,
                full_name="Kaku Pro User",
                is_active=True
            )
            db.add(new_user)
            await db.commit()
            print(f"User {email} created!")
        else:
            print(f"User {email} already exists.")

if __name__ == "__main__":
    asyncio.run(create_demo_user())
