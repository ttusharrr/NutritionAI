import json
import os
import random
import math

# Singleton in-memory cache to prevent disastrous Disk I/O bottlenecks
_DATASET_CACHE = {}

def load_regional_recipes(region="All"):
    """Legacy wrapper for compatibility."""
    return load_recipes("Dishes")

def load_recipes(dataset_type="Dishes"):
    """Load the corresponding dataset from RAM if available, else from Disk."""
    global _DATASET_CACHE
    
    # 1. Return from RAM (0.0001 seconds)
    if dataset_type in _DATASET_CACHE:
        return _DATASET_CACHE[dataset_type]
        
    # 2. Read from Disk (Expensive) -> Cache -> Return
    if dataset_type == "Raw":
        filename = 'raw_foods_dataset.json'
    else:
        filename = 'indian_food_nutrition.json'
        
    data_path = os.path.join(os.path.dirname(__file__), '..', 'data', filename)
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            _DATASET_CACHE[dataset_type] = data
            return data
    except Exception as e:
        print(f"Error loading {dataset_type} dataset: {e}")
        return []

def calculate_distance(target, candidate_scaled):
    """
    Calculate Euclidean Distance between target macros and candidate macros.
    Lower distance = Better match.
    """
    p_diff = (target['protein'] - candidate_scaled['protein']) ** 2
    c_diff = (target['carbs'] - candidate_scaled['carbs']) ** 2
    f_diff = (target['fat'] - candidate_scaled['fats']) ** 2
    
    return math.sqrt(p_diff + c_diff + f_diff)

def get_recommendations(user_macros, region="All", filters=None, exclude_ids=None, top_n=5, dataset_type="Dishes"):
    """
    Layer 3 & 4: Match dishes based on scaled macros and apply constraints.
    Supports quantity calculation to precisely hit calorie targets.
    """
    recipes = load_recipes(dataset_type)
    if not recipes:
        return []

    # Calculate target calories from macros (P:4, C:4, F:9)
    target_cals = (user_macros['protein'] * 4) + (user_macros['carbs'] * 4) + (user_macros['fat'] * 9)

    # 1. Apply Hard Filters (Layer 4)
    filtered_recipes = recipes
    if exclude_ids:
        filtered_recipes = [r for r in filtered_recipes if r['id'] not in exclude_ids]
        
    if filters:
        target_diet = filters.get('type') # 'Veg', 'Non-Veg', or 'Both'
        if target_diet and target_diet != 'Both':
            # Soft fallback for Raw if it doesn't match perfectly
            diet_matches = [r for r in filtered_recipes if r.get('type') == target_diet]
            if diet_matches:
                filtered_recipes = diet_matches
        
        # Meal Type filter
        if filters.get('meal_type') and dataset_type == "Dishes":
            target_type = filters['meal_type']
            if target_type == 'snacks': target_type = 'snack'
            
            if target_type == 'dinner':
                # Workaround: Dinner dataset is very small (19 dishes), so allow lunch dishes for dinner slots
                slot_matches = [r for r in filtered_recipes if r.get('meal_type') in ['dinner', 'lunch']]
            else:
                slot_matches = [r for r in filtered_recipes if r.get('meal_type') == target_type]
                
            if slot_matches:
                filtered_recipes = slot_matches

        # Allergy filter
        allergies = filters.get('allergies', [])
        if allergies:
            filtered_recipes = [
                r for r in filtered_recipes 
                if not any(a.lower() in str(r.get('ingredients', [])).lower() or a.lower() in r['name'].lower() for a in allergies)
            ]

        # Disease constraints
        diseases = filters.get('diseases', [])
        if "BP" in diseases:
            # Filter out dishes with sodium > 500mg per serving (or high sodium relative to calories)
            filtered_recipes = [r for r in filtered_recipes if r['nutrients'].get('sodium', 0) < 500]
        
        if "Diabetes" in diseases:
            # Filter out dishes with sugar > 10g per serving
            filtered_recipes = [r for r in filtered_recipes if r['nutrients'].get('sugar', 0) < 10]

        # Region Prioritization
        target_region = filters.get('region', 'All')
        if target_region and target_region != 'All' and target_region != 'Global':
            region_matches = [r for r in filtered_recipes if target_region.lower() in r.get('sub_region', '').lower() or r.get('sub_region') == 'All']
            if region_matches:
                filtered_recipes = region_matches

    # 2. Calculate "Distance" for each recipe using Calorie-Scaling (Layer 3)
    scored_recipes = []
    for recipe in filtered_recipes:
        base_nutrients = recipe['nutrients']
        base_cals = base_nutrients.get('calories', 1)
        if base_cals <= 0: continue # Avoid division by zero
        
        # Scale to match calorie target exactly
        scale_multiplier = target_cals / base_cals
        
        scaled_nutrients = {
            "calories": target_cals,
            "protein": base_nutrients.get('protein', 0) * scale_multiplier,
            "carbs": base_nutrients.get('carbs', 0) * scale_multiplier,
            "fats": base_nutrients.get('fats', 0) * scale_multiplier,
            "sugar": base_nutrients.get('sugar', 0) * scale_multiplier,
            "sodium": base_nutrients.get('sodium', 0) * scale_multiplier
        }
        
        dist = calculate_distance(user_macros, scaled_nutrients)
        
        scored_recipes.append({
            **recipe,
            "match_score": dist,
            "scaled_nutrients": scaled_nutrients,
            "scale_multiplier": scale_multiplier
        })

    # 3. Sort by raw distance
    scored_recipes.sort(key=lambda x: x['match_score'])
    
    # Randomization: Pick randomly from the top 10 closest matches to provide variety
    if scored_recipes and top_n == 1:
        pool_size = min(10, len(scored_recipes))
        best_match = random.choice(scored_recipes[:pool_size])
        return [best_match]
        
    return scored_recipes[:top_n]
