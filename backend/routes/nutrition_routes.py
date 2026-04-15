from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.nutrition_calc import calculate_daily_requirements
from utils.nutrition_matcher import get_recommendations, load_regional_recipes

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
    5. Agentic Reasoning (Placeholder)
    """
    db = current_app.config['db']
    user_id = get_jwt_identity()
    
    user = db.users.find_one({"email": user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if not user.get('profile_completed'):
        return jsonify({"error": "Please complete your profile first"}), 400

    # Layer 1 & 2: Calculate Requirements
    profile = user.get('profile', {})
    nutrition_targets = calculate_daily_requirements(profile)
    
    # Layer 3 & 4: Match Dishes (k-NN + Filter)
    # We focus on the user's regional preference if set to J&K
    filters = {
        "type": "Veg" if "Vegetarian" in profile.get('restrictions', []) else None,
        "cuisine": profile.get('region') if profile.get('region') in ['Kashmiri', 'Dogri'] else None
    }
    
    # For now, let's assume we want to match their daily calorie limit divided by 3 (for one meal)
    single_meal_macros = {
        "protein": nutrition_targets['macros']['protein'] / 3,
        "carbs": nutrition_targets['macros']['carbs'] / 3,
        "fat": nutrition_targets['macros']['fat'] / 3
    }
    
    recommendations = get_recommendations(single_meal_macros, filters=filters, top_n=3)

    # Layer 5: Agentic Reasoning (Simulated for Now)
    # In a real scenario, we'd pass these to GPT-4o-mini here.
    processed_recommendations = []
    for rec in recommendations:
        processed_recommendations.append({
            "id": rec['id'],
            "name": rec['name'],
            "cuisine": rec['cuisine'],
            "macros": rec['nutrients'],
            "ingredients": rec['ingredients'],
            "agent_hint": f"This is a {rec['cuisine']} specialty. We've balanced this to fit your {profile.get('dietary_goal')} goal."
        })

    return jsonify({
        "user_targets": nutrition_targets,
        "recommendations": processed_recommendations,
        "message": "Personalized J&K regional meal plan generated."
    }), 200

@nutrition_bp.route('/recipes/jk', methods=['GET'])
def get_jk_recipes():
    """Return the raw list of J&K recipes for exploration."""
    recipes = load_regional_recipes()
    return jsonify(recipes), 200
