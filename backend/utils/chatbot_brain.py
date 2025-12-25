import os
import requests
import json
import math
from google import genai

# Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyB90u1P8GKAJM6AgC2WLaI9biskDAgzDkw")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBYuOxGdB85esxj3UrfbaVvoc7_VxWF2FE")

# Configure Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Radius of Earth in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def find_shops_near_me(lat, lng, query="healthy snacks"):
    if not lat or not lng:
        return []
        
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.regularOpeningHours"
    }
    
    # Construct a natural language query
    # "buy {product}" often works well with searchText to find shops selling it
    text_query = f"buy {query}"
    
    payload = {
        "textQuery": text_query,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": 2000.0 # 2km radius
            }
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            raw_results = response.json().get('places', [])
            cleaned_results = []
            
            for shop in raw_results:
                # Calculate distance
                loc = shop.get('location', {})
                slat = loc.get('latitude')
                slng = loc.get('longitude')
                dist_km = None
                if slat is not None and slng is not None:
                    dist_km = round(haversine_distance(lat, lng, slat, slng), 2)
                
                # Check open status
                open_now = None
                hours = shop.get('regularOpeningHours')
                if hours:
                    open_now = hours.get('openNow')

                cleaned_results.append({
                    "name": shop.get('displayName', {}).get('text', 'Unknown Shop'),
                    "vicinity": shop.get('formattedAddress', 'Address invalid'),
                    "rating": shop.get('rating'),
                    "user_ratings_total": shop.get('userRatingCount'),
                    "latitude": slat,
                    "longitude": slng,
                    "distance_km": dist_km,
                    "open_now": open_now
                })
            
            # Sort by distance
            cleaned_results.sort(key=lambda x: x['distance_km'] if x['distance_km'] is not None else float('inf'))
                    
            return cleaned_results
        else:
            print(f"Maps API Error: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"Error fetching places: {e}")
        return []

PROMPT_TEMPLATE='''ROLE:
You are a nutrition recommendation assistant that evaluates a food item and returns three practical types of improvements:
1) Main nutritional issues
2) Simple, actionable fixes
3) Quick recipe-style adds or pairings

DIRECTION:
Given a food name or nutrition text, think step-by-step about what nutritional issues it commonly has. Then generate clear, actionable recommendations that are realistic for everyday people. Focus on real-world nutrient problems: high sugar, high sodium, low protein, low fiber, excess calories, low nutrient density.

DOMAIN:
Nutrition guidance based on typical nutrient profiles of packaged foods, snacks, and common meals.

OUTPUT FORMAT:
Respond in this JSON structure ONLY:

{
  "food": "<food name>",
  "main_issues": ["issue1", "issue2", ...],
  "simple_fixes": ["fix1", "fix2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}

FEW-SHOT EXAMPLES:

EXAMPLE 1:
INPUT: "Potato chips"
OUTPUT:
{
  "food": "Potato chips",
  "main_issues": ["High sodium", "Low protein", "Low fiber"],
  "simple_fixes": ["Choose a smaller portion", "Pick lightly-salted versions"],
  "recommendations": ["Pair with a handful of nuts for protein and satiety"]
}

EXAMPLE 2:
INPUT: "Instant noodles"
OUTPUT:
{
  "food": "Instant noodles",
  "main_issues": ["Very high sodium", "Low protein", "Low fiber"],
  "simple_fixes": ["Use half the seasoning packet", "Add an egg or tofu"],
  "recommendations": ["Add 150g vegetables + 1 egg to turn it into a balanced meal"]
}

EXAMPLE 3:
INPUT: "Candy bar"
OUTPUT:
{
  "food": "Candy bar",
  "main_issues": ["High sugar", "Low satiety", "Low protein"],
  "simple_fixes": ["Eat half the bar", "Pair with nuts to slow sugar absorption"],
  "recommendations": ["Add 20g almonds to create a balanced snack"]
}

EXAMPLE 4:
INPUT: "Sweetened yogurt"
OUTPUT:
{
  "food": "Sweetened yogurt",
  "main_issues": ["Added sugar", "Low fiber"],
  "simple_fixes": ["Choose low-sugar or plain yogurt", "Add fruit instead of flavored mix"],
  "recommendations": ["Add chia seeds for fiber and omega-3"]
}

EXAMPLE 5:
INPUT: "Breakfast cereal"
OUTPUT:
{
  "food": "Breakfast cereal",
  "main_issues": ["High sugar", "Low protein", "Low fiber (for many brands)"],
  "simple_fixes": ["Mix with oats to reduce sugar per serving", "Use smaller bowl"],
  "recommendations": ["Add Greek yogurt + 1 fruit to improve protein + fiber"]
}

END OF FEW-SHOT EXAMPLES.

NOW ANSWER THE USER INPUT STRICTLY USING THE JSON FORMAT.'''

def get_food_recommendation(food_name, lat=None, lng=None, preferences=None):
    location_info = ""
    if lat is not None and lng is not None:
        location_info = f"\nUSER LOCATION: Latitude {lat}, Longitude {lng}. (If relevant, consider regional availability or cuisine styles for this location).\n"

    preferences_info = ""
    if preferences:
        preferences_info = f"\nUSER PREFERENCES: {json.dumps(preferences)}. STRICTLY TAILOR your output to these preferences (e.g., if vegan, do not recommend meat/dairy). If the food violates a preference (e.g. high sugar user eating candy), WARN them in 'main_issues'.\n"

    complete_prompt = PROMPT_TEMPLATE + f"{location_info}{preferences_info}\nINPUT: \"{food_name}\"\n"
    try:
        resp = client.models.generate_content(model="gemini-flash-latest", contents=complete_prompt)
        if hasattr(resp, 'text') and resp.text:
            return resp.text
        else:
             print("[ERROR] LLM returned empty response")
             return json.dumps({
                "food": food_name,
                "main_issues": ["AI service temporarily unavailable"],
                "simple_fixes": ["Please try again later"],
                "recommendations": []
            })
    except Exception as e:
        print(f"[ERROR] LLM Generation failed: {e}")
        return json.dumps({
            "food": food_name,
            "main_issues": ["Could not analyze due to AI service error"],
            "simple_fixes": ["Please try again"],
            "recommendations": []
        })
