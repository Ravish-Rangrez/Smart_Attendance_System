import asyncio
from datetime import datetime, timezone
import motor.motor_asyncio
from app.core.config import settings
from app.core.security import get_password_hash

async def seed_database():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # 1. Seed Admin User
    admin_email = "admin@smartattendance.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_doc = {
            "name": "System Administrator",
            "email": admin_email,
            "passwordHash": get_password_hash("admin123"),
            "role": "ADMIN",
            "createdAt": datetime.now(timezone.utc)
        }
        res = await db.users.insert_one(admin_doc)
        print(f"Created Admin user '{admin_email}' with ID: {res.inserted_id}")
    else:
        print(f"Admin user '{admin_email}' already exists.")

    # 2. Seed Subjects
    subjects = [
        {"name": "Mathematics", "code": "MATH101", "isActive": True},
        {"name": "Physics", "code": "PHYS101", "isActive": True},
        {"name": "Chemistry", "code": "CHEM101", "isActive": True},
        {"name": "English", "code": "ENG101", "isActive": True}
    ]

    for subj in subjects:
        existing_subj = await db.subjects.find_one({"code": subj["code"]})
        if not existing_subj:
            subj["createdAt"] = datetime.now(timezone.utc)
            res = await db.subjects.insert_one(subj)
            print(f"Created Subject '{subj['name']}' ({subj['code']}) with ID: {res.inserted_id}")
        else:
            print(f"Subject '{subj['name']}' ({subj['code']}) already exists.")

    # 3. Create Unique Indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.students.create_index("studentId", unique=True)
        await db.subjects.create_index("code", unique=True)
        await db.attendance_records.create_index(
            [("sessionId", 1), ("studentId", 1)],
            unique=True
        )
        print("Database indexes initialized successfully.")
    except Exception as e:
        print(f"Index initialization notice: {e}")

    client.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_database())
