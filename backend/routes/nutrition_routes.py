from flask import Blueprint, jsonify, current_app, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timezone
import hashlib
import json
import threading
import time
from utils.nutrition_calc import calculate_daily_requirements
from utils.nutrition_matcher import get_recommendations, load_regional_recipes
from utils.ai_agent import MealAgent
from utils.gi_estimator import estimate_glycemic_index

nutrition_bp = Blueprint('nutrition', __name__, url_prefix='/api/nutrition')

def generate_insights_async(app, db, user_id, profile, daily_plan, profile_hash, nutrition_targets, region):
    # This runs in a background thread with application context
    with app.app_context():
        try:
            ai_agent = MealAgent()
            print(f"[AI AGENT ASYNC] Launching background LLM insights call for user: {user_id}")
            ai_insights = ai_agent.generate_daily_insights(profile, daily_plan)
            if isinstance(ai_insights, dict):
                # Update the daily plan recommendations dict
                for slot, data in ai_insights.items():
                    if slot in daily_plan and isinstance(data, dict):
                        daily_plan[slot]['agent_hint'] = data.get('insight', daily_plan[slot]['agent_hint'])
                        daily_plan[slot]['core_item'] = data.get('core_item', daily_plan[slot]['core_item'])
                
                updated_response = {
                    "user_targets": nutrition_targets,
                    "recommendations": daily_plan,
                    "region_available": True,
                    "message": f"Full-day regional meal plan generated for {region}."
                }
                
                db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {
                        "$set": {
                            "meal_plan_cache": {
                                "profile_hash": profile_hash,
                                "data": updated_response,
                                "cached_at": datetime.now(timezone.utc)
                            }
                        }
                    }
                )
                print(f"[AI AGENT ASYNC SUCCESS] Saved background LLM insights to cache for user: {user_id}")
            else:
                print("[AI AGENT ASYNC WARNING] Invalid AI insights format, skipping cache update.")
        except Exception as e:
            print(f"[AI AGENT ASYNC ERROR] Background reasoning failed: {e}")

@nutrition_bp.route('/recommend', methods=['GET'])
@jwt_required()
def recommend_meals():
    """
    Complete 5-Layer Pipeline:
    1. Input/Profile
    2. Macro Splitter
    3. ML Matcher (k-NN)
    4. Constraint Filter
    5. Agentic Reasoning (OpenAI)
    """
    db = current_app.config['db']
    user_id = get_jwt_identity()
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if not user.get('profile_completed'):
        return jsonify({"error": "Please complete your profile first"}), 400

    # Extract profile and region
    profile = user.get('profile', {})
    region = profile.get('region', 'Punjab')
    
    # Check force_refresh query param
    force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
    
    # Create profile hash to detect any input profile/biometric/region changes
    profile_data_to_hash = {
        "age": profile.get("age"),
        "gender": profile.get("gender"),
        "weight": profile.get("weight"),
        "height": profile.get("height"),
        "activity_level": profile.get("activity_level"),
        "dietary_goal": profile.get("dietary_goal"),
        "dietary_type": profile.get("dietary_type", "both"),
        "region": region,
        "diseases": sorted(profile.get("diseases", [])),
        "allergies": sorted(profile.get("allergies", [])),
        "restrictions": sorted(profile.get("restrictions", [])),
    }
    profile_json = json.dumps(profile_data_to_hash, sort_keys=True)
    profile_hash = hashlib.sha256(profile_json.encode('utf-8')).hexdigest()
    
    # Check cache eligibility
    cached_plan = user.get('meal_plan_cache')
    if not force_refresh and cached_plan and cached_plan.get('profile_hash') == profile_hash:
        print(f"[NUTRITION CACHE HIT] Serving cached meal plan for user: {user_id}")
        return jsonify(cached_plan.get('data')), 200
    
    import time
    t_start = time.time()
    print(f"[NUTRITION] Generating plan for user: {user_id} in region: {region}")

    # Layer 1 & 2: Get Requirements from DB (Calculate if missing for older accounts)
    nutrition_targets = user.get("nutrition_targets")
    if not nutrition_targets:
        nutrition_targets = calculate_daily_requirements(profile)
        db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"nutrition_targets": nutrition_targets}})
        print(f"[NUTRITION] Targets calculated and saved to DB: {nutrition_targets['daily_calories']} kcal")
    else:
        print(f"[NUTRITION] Targets fetched from DB: {nutrition_targets['daily_calories']} kcal")
    
    available_recipes = load_regional_recipes(region)
    
    if not available_recipes:
        print(f"[NUTRITION WARNING] No recipes found for region: {region}")
        response_data = {
            "user_targets": nutrition_targets,
            "recommendations": {},
            "region_available": False,
            "message": f"Our nutritional database for {region} is currently under development. Please check back soon for local specialties!"
        }
        # Cache even the empty/fallback response to avoid repeated LLM calls
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "meal_plan_cache": {
                        "profile_hash": profile_hash,
                        "data": response_data,
                        "cached_at": datetime.now(timezone.utc)
                    }
                }
            }
        )
        return jsonify(response_data), 200

    # Professional Caloric Splitting Ratios (Including Sides & Drinks)
    slots = {
        "breakfast": 0.20,
        "lunch": 0.30,
        "snacks": 0.10,
        "dinner": 0.25,
        "sides": 0.10,
        "drinks": 0.05
    }
    
    daily_plan = {}
    exclude_ids = []
    
    # Base filters from user profile
    dietary_type = profile.get('dietary_type', 'both') # 'Veg', 'Non-Veg', 'Both'
    diet_map = {'Veg': 'Veg', 'Non-Veg': 'Non-Veg', 'Both': 'Both'}
    target_diet = diet_map.get(dietary_type, 'Both')

    base_filters = {
        "type": target_diet,
        "region": region,
        "diseases": profile.get('diseases', []),
        "allergies": profile.get('allergies', []),
    }

    for slot, ratio in slots.items():
        slot_macros = {
            "protein": nutrition_targets['macros']['protein'] * ratio,
            "carbs": nutrition_targets['macros']['carbs'] * ratio,
            "fat": nutrition_targets['macros']['fat'] * ratio
        }
        
        # Combine base filters with meal-specific slot
        slot_filters = {**base_filters, "meal_type": slot}
        
        # Get one best recommendation for this slot (from Dishes)
        recs = get_recommendations(slot_macros, region="All", filters=slot_filters, exclude_ids=exclude_ids, top_n=1, dataset_type="Dishes")
        
        if recs:
            rec = recs[0]
            exclude_ids.append(rec['id'])
            # Since matcher now scopes to EXACT target cals, we use scaled_nutrients
            nutrients = rec.get('scaled_nutrients', rec['nutrients'])
            multiplier = rec.get('scale_multiplier', 1)
            base_g = rec.get('base_serving_g', 100)
            
            # Calculate Glycemic Index dynamically
            from utils.gi_estimator import estimate_glycemic_index
            gi_val, gi_cat = estimate_glycemic_index(rec['name'], nutrients, rec.get('ingredients', []))
            
            default_hints = {
                "breakfast": "High protein/fiber starting meal to stabilize blood sugar and fuel your morning.",
                "lunch": "Nutrient-dense mid-day meal structured to maintain energy and focus.",
                "snacks": "Light calorie-controlled snack to bridge the gap and prevent cravings.",
                "dinner": "Lean, easy-to-digest dinner optimized for muscle recovery and sleep.",
                "sides": "Vitamin and fiber booster to support digestion and gut microbiome.",
                "drinks": "Low glycemic hydration pick to maintain metabolic rate and fluid balance."
            }

            daily_plan[slot] = {
                "id": rec['id'],
                "name": rec['name'],
                "category": rec.get('category', 'Dish'),
                "quantity_grams": round(base_g * multiplier), 
                "glycemic_index": gi_val,
                "gi_category": gi_cat,
                "macros": {
                    "calories": round(nutrients.get('calories', 0)),
                    "protein": round(nutrients.get('protein', 0)),
                    "carbs": round(nutrients.get('carbs', 0)),
                    "fat": round(nutrients.get('fats', 0)),
                },
                "ingredients": rec.get('ingredients', []),
                "sub_region": rec.get('sub_region', region),
                "target_calories": round(nutrition_targets['daily_calories'] * ratio),
                "agent_hint": default_hints.get(slot, f"Professional {slot} pick. Balanced to your target."),
                "core_item": "Healthy Food"
            }

    # Serve the baseline recommendations immediately to eliminate UI latency
    response_data = {
        "user_targets": nutrition_targets,
        "recommendations": daily_plan,
        "region_available": True,
        "message": f"Full-day regional meal plan generated for {region}."
    }

    # Save the initial plan to the database cache
    try:
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "meal_plan_cache": {
                        "profile_hash": profile_hash,
                        "data": response_data,
                        "cached_at": datetime.now(timezone.utc)
                    }
                }
            }
        )
        print(f"[NUTRITION CACHE SAVE] Cached initial meal plan for user: {user_id}")
    except Exception as e:
        print(f"[NUTRITION CACHE ERROR] Failed to save initial cache: {e}")

    # Launch background thread to query the LLM and enrich the cache asynchronously
    app = current_app._get_current_object()
    threading.Thread(
        target=generate_insights_async,
        args=(app, db, user_id, profile, daily_plan, profile_hash, nutrition_targets, region)
    ).start()

    print(f"[NUTRITION] Initial plan served in {time.time() - t_start:.2f}s. Spawning background thread for AI insights.")
    return jsonify(response_data), 200

@nutrition_bp.route('/recipes/jk', methods=['GET'])
def get_jk_recipes():
    """Return the raw list of J&K recipes for exploration."""
    recipes = load_regional_recipes()
    return jsonify(recipes), 200

@nutrition_bp.route('/recipe', methods=['GET'])
@jwt_required()
def get_ai_recipe():
    """Generate a recipe dynamically using the AI Agent."""
    from flask import request
    dish_name = request.args.get('dish')
    if not dish_name:
        return jsonify({"error": "Dish name is required"}), 400
        
    ai_agent = MealAgent()
    recipe_data = ai_agent.generate_recipe(dish_name)
    
    if "error" in recipe_data:
        return jsonify(recipe_data), 500
        
    return jsonify({"recipe": recipe_data}), 200

@nutrition_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_with_agent():
    from flask import request
    data = request.get_json()
    message = data.get('message')
    history = data.get('history', [])
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    db = current_app.config['db']
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    profile = user.get('profile', {}) if user else {}
        
    ai_agent = MealAgent()
    response_text = ai_agent.chat(message, history, profile)
    
    return jsonify({"response": response_text}), 200
