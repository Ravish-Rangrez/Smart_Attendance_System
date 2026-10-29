#!/usr/bin/env python3
import sys
sys.path.insert(0, '/backend')

import asyncio
from app.core.database import DatabaseManager
from app.repositories.student_repository import student_repository
from bson import ObjectId

async def debug_encodings():
    # Initialize database
    db_manager = DatabaseManager()
    db_manager.connect()
    
    try:
        # Get all students with encodings
        students = await student_repository.get_all_with_encodings()
        print(f"✅ Students with face encodings: {len(students)}")
        
        for s in students:
            encoding = s.get('faceEncoding')
            if encoding:
                print(f"\n  Student: {s.get('name')} ({s.get('studentId')})")
                print(f"    Encoding length: {len(encoding)} dimensions")
                print(f"    First 5 values: {encoding[:5]}")
                print(f"    Sample: {type(encoding)}")
        
        # Get ALL students
        all_students = await student_repository.collection.find().to_list(100)
        print(f"\n\n📋 ALL Students ({len(all_students)} total):")
        for s in all_students:
            has_enc = 'faceEncoding' in s and s['faceEncoding'] is not None
            enc_status = f"✅ ({len(s['faceEncoding'])} dims)" if has_enc else "❌ None"
            print(f"  - {s.get('name')} ({s.get('studentId')}) {enc_status}")
    
    finally:
        db_manager.disconnect()

if __name__ == "__main__":
    try:
        asyncio.run(debug_encodings())
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
