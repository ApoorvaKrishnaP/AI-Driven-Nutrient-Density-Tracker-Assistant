from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import json
from sqlalchemy.orm import Session
from backend.utils.chatbot_brain import get_food_recommendation, find_shops_near_me
from backend.database import get_db
from backend import database

router = APIRouter(tags=["Chatbot"])

class FoodRequest(BaseModel):
    food: str
    lat: float = None
    lng: float = None

class ShopRequest(BaseModel):
    lat: float
    lng: float
    query: str

import asyncio

@router.post("/shops")
def get_shops(req: ShopRequest):
    try:
        print(f"[DEBUG] Finding shops for: {req.query} near {req.lat}, {req.lng}", flush=True)
        # Call the synchronous function directly. FastAPI runs 'def' endpoints in a threadpool.
        shops = find_shops_near_me(req.lat, req.lng, req.query)
        print(f"[DEBUG] Found {len(shops)} shops", flush=True)
        return {"shops": shops}
    except Exception as e:
        print(f"[ERROR] Shop endpoint error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend")
async def recommend(req: FoodRequest, db: Session = Depends(get_db)):
    try:
        print(f"[DEBUG] Received request for: {req.food} at location: {req.lat}, {req.lng}", flush=True)
        
        # 1. Try to fetch preferences
        prefs_entry = db.query(database.UserPreferences).order_by(database.UserPreferences.id.desc()).first()
        
        user_prefs = None
        if prefs_entry:
            user_prefs = {
                "diet_type": prefs_entry.diet_type,
                "is_low_sugar": prefs_entry.is_low_sugar,
                "is_low_carb": prefs_entry.is_low_carb,
                "is_lactose_free": prefs_entry.is_lactose_free,
                "primary_goal": prefs_entry.primary_goal
            }
            print(f"[DEBUG] Found user preferences: {user_prefs}", flush=True)
        
        # Only run LLM (Map search triggered on demand via /shops)
        # Using to_thread here is good because get_food_recommendation uses GenAI client which might be blocking or sync
        resp_text = await asyncio.to_thread(
            get_food_recommendation,
            req.food, 
            req.lat, 
            req.lng, 
            preferences=user_prefs
        )
        
        print(f"[DEBUG] Parsing response: {resp_text}", flush=True)
        
        # Try to parse as JSON
        try:
            cleaned_text = resp_text.strip().lstrip("```json").rstrip("```")
            data = json.loads(cleaned_text)
            print(f"[DEBUG] Successfully parsed JSON", flush=True)
            print(data, flush=True)
            return data
        except json.JSONDecodeError:
            # If Gemini didn't return valid JSON, return raw text
            print(f"[DEBUG] JSON parsing failed, returning raw response", flush=True)
            return {"raw": resp_text}
            
    except Exception as e:
        print(f"[ERROR] Endpoint error: {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
