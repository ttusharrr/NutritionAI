import json
import os
import random
import math

def load_regional_recipes():
    """Load the J&K recipe dataset from the local JSON file."""
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'jk_recipes.json')
    try:
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading recipes: {e}")
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

def get_recommendations(user_macros, filters=None, top_n=5):
    """
    Layer 3 & 4: Match dishes based on macros and apply constraints.
    """
    recipes = load_regional_recipes()
    if not recipes:
        return []

    # 1. Apply Hard Filters (Layer 4)
    filtered_recipes = recipes
    if filters:
        if filters.get('type'): # Veg / Non-Veg
            filtered_recipes = [r for r in filtered_recipes if r['type'] == filters['type']]
        if filters.get('cuisine'): # Kashmiri / Dogri
            filtered_recipes = [r for r in filtered_recipes if r['cuisine'] == filters['cuisine']]

    # 2. Calculate "Distance" for each recipe (Layer 3)
    scored_recipes = []
    for recipe in filtered_recipes:
        dist = calculate_distance(user_macros, recipe['nutrients'])
        
        # Add a small random "shuffle" factor for variety (Layer 4)
        variance = random.uniform(0, 5) # 0 to 5 macro points of jitter
        final_score = dist + variance
        
        scored_recipes.append({
            **recipe,
            "match_score": round(final_score, 2)
        })

    # 3. Sort by score (ascending) and return top N
    scored_recipes.sort(key=lambda x: x['match_score'])
    
    return scored_recipes[:top_n]
