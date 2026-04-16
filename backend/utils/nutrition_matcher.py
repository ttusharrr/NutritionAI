import json
import os
import random
import math

def load_regional_recipes(region="J&K"):
    """Load the regional recipe dataset from the local JSON file."""
    # Mapping region selection to filename
    file_map = {
        "J&K": "jk_recipes.json",
    }
    
    file_name = file_map.get(region)
    if not file_name:
        return []

    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', file_name)
    try:
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading recipes for {region}: {e}")
        return []

def calculate_distance(target, candidate):
    """
    Calculate Euclidean Distance between target macros and candidate macros.
    Lower distance = Better match.
    """
    p_diff = (target['protein'] - candidate['protein']) ** 2
    c_diff = (target['carbs'] - candidate['carbs']) ** 2
    f_diff = (target['fat'] - candidate['fats']) ** 2
    
    return math.sqrt(p_diff + c_diff + f_diff)

def get_recommendations(user_macros, region="J&K", filters=None, exclude_ids=None, top_n=5):
    """
    Layer 3 & 4: Match dishes based on macros and apply constraints.
    Supports meal_type (breakfast, lunch, snack, dinner) and sub_region.
    """
    recipes = load_regional_recipes(region)
    if not recipes:
        return []

    # 1. Apply Hard Filters (Layer 4)
    filtered_recipes = recipes
    if exclude_ids:
        filtered_recipes = [r for r in filtered_recipes if r['id'] not in exclude_ids]
        
    if filters:
        target_diet = filters.get('type') # 'Veg', 'Non-Veg', or 'Both'
        if target_diet and target_diet != 'Both':
            filtered_recipes = [r for r in filtered_recipes if r['type'] == target_diet]
        
        # Sub-region filter (e.g., Kashmir, Jammu, Ladakh)
        if filters.get('sub_region'):
            filtered_recipes = [r for r in filtered_recipes if r['sub_region'] == filters['sub_region']]
            
        # Meal Type filter (Primary for professional split)
        if filters.get('meal_type'):
            target_type = filters['meal_type']
            # Normalize 'snacks' to 'snack'
            if target_type == 'snacks': target_type = 'snack'
            
            slot_matches = [r for r in filtered_recipes if r.get('meal_type') == target_type]
            # Fallback: if no dish of that type exists (after exclusions), use the whole set
            if slot_matches:
                filtered_recipes = slot_matches

    # 2. Calculate "Distance" for each recipe (Layer 3)
    scored_recipes = []
    for recipe in filtered_recipes:
        dist = calculate_distance(user_macros, recipe['nutrients'])
        
        # Add a small random "shuffle" factor for variety (Layer 4)
        variance = random.uniform(0, 3) 
        final_score = dist + variance
        
        scored_recipes.append({
            **recipe,
            "match_score": round(final_score, 2)
        })

    # 3. Sort by score (ascending) and return top N
    scored_recipes.sort(key=lambda x: x['match_score'])
    
    return scored_recipes[:top_n]
