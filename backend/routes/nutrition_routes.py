from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from utils.nutrition_calc import calculate_daily_requirements
from utils.nutrition_matcher import get_recommendations, load_regional_recipes
from utils.ai_agent import MealAgent

nutrition_bp = Blueprint('nutrition', __name__, url_prefix='/api/nutrition')

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
    
    # Initialize AI Agent (Hardened)
    ai_agent = MealAgent()
    
    print(f"[NUTRITION] Generating plan for user: {user_id} in region: {region}")

    # Layer 1 & 2: Calculate Requirements
    nutrition_targets = calculate_daily_requirements(profile)
    print(f"[NUTRITION] Targets calculated: {nutrition_targets['daily_calories']} kcal")
    
    available_recipes = load_regional_recipes(region)
    
    if not available_recipes:
        print(f"[NUTRITION WARNING] No recipes found for region: {region}")
        return jsonify({
            "user_targets": nutrition_targets,
            "recommendations": {},
            "region_available": False,
            "message": f"Our nutritional database for {region} is currently under development. Please check back soon for local specialties!"
        }), 200

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
            
            daily_plan[slot] = {
                "id": rec['id'],
                "name": rec['name'],
                "category": rec.get('category', 'Dish'),
                "quantity_grams": round(base_g * multiplier), 
                "macros": {
                    "calories": round(nutrients.get('calories', 0)),
                    "protein": round(nutrients.get('protein', 0)),
                    "carbs": round(nutrients.get('carbs', 0)),
                    "fat": round(nutrients.get('fats', 0)),
                },
                "ingredients": rec.get('ingredients', []),
                "sub_region": rec.get('sub_region', region),
                "target_calories": round(nutrition_targets['daily_calories'] * ratio),
                "agent_hint": f"Professional {slot} pick. Balanced to your target.",
                "core_item": "Healthy Food"
            }

    # Layer 5: Agentic Reasoning (The "Brain")
    # Batch the whole plan to the LLM for expert insights
    print(f"[NUTRITION] Entering Layer 5: Agentic Reasoning...")
    try:
        ai_insights = ai_agent.generate_daily_insights(profile, daily_plan)
        if type(ai_insights) is dict:
            print(f"[NUTRITION] Successfully integrated {len(ai_insights)} AI insights.")
            for slot, data in ai_insights.items():
                if slot in daily_plan and type(data) is dict:
                    daily_plan[slot]['agent_hint'] = data.get('insight', daily_plan[slot]['agent_hint'])
                    daily_plan[slot]['core_item'] = data.get('core_item', 'Healthy Base Item')
        else:
            print("[NUTRITION] AI insights format invalid, using defaults.")
    except Exception as e:
        print(f"[NUTRITION ERROR] Agentic Reasoning Layer Failed: {e}")

    print("[NUTRITION] Meal plan generation complete.")

    return jsonify({
        "user_targets": nutrition_targets,
        "recommendations": daily_plan,
        "region_available": True,
        "message": f"Full-day regional meal plan generated for {region}."
    }), 200

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
