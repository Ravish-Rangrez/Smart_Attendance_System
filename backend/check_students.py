#!/usr/bin/env python3
import asyncio
import motor.motor_asyncio

async def check_students():
    mongo_uri = 'mongodb+srv://ravishrang1315_db_user:L0XI2BSkbg5XloW5@cluster0.fupl3xr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    client = motor.motor_asyncio.AsyncMotorClient(mongo_uri)
    db = client['smart_attendance_db']
    
    try:
        # Check total students
        total = await db.students.count_documents({})
        print(f'Total Students: {total}')
        
        # Check students with face encodings
        with_encoding = await db.students.count_documents({'faceEncoding': {'$exists': True, '$ne': None}})
        print(f'Students with Face Encoding: {with_encoding}')
        
        # Show all students
        students = await db.students.find().to_list(100)
        print(f'\nAll Students:')
        for s in students:
            has_encoding = 'faceEncoding' in s and s['faceEncoding'] is not None
            encoding_status = '✅ HAS ENCODING' if has_encoding else '❌ NO ENCODING'
            print(f"  - {s.get('name', 'Unknown')} ({s.get('studentId', 'N/A')}) {encoding_status}")
        
        # Check subjects
        print(f'\n\nSubjects:')
        subjects = await db.subjects.find().to_list(50)
        for subj in subjects:
            print(f"  - {subj.get('name', 'Unknown')} (ID: {subj['_id']})")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_students())
