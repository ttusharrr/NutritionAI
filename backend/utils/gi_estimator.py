def estimate_glycemic_index(dish_name, nutrients, ingredients):
    """
    Dynamically estimate the Glycemic Index of a dish based on its name, ingredients, and macro ratios.
    Returns a tuple: (glycemic_index_value, glycemic_index_category)
    """
    name_lower = dish_name.lower()
    
    # 1. Extract nutrients
    calories = nutrients.get('calories', 0)
    carbs = nutrients.get('carbs', 0)
    # Handle the fact that fats might be spelled 'fats' or 'fat'
    fats = nutrients.get('fats', nutrients.get('fat', 0))
    protein = nutrients.get('protein', 0)
    sugar = nutrients.get('sugar', 0)
    sodium = nutrients.get('sodium', 0)

    # Convert ingredients array to lowercase string for easier searching
    ingredients_str = " ".join([i.lower() for i in ingredients]) if isinstance(ingredients, list) else str(ingredients).lower()

    # 2. Base mapping logic depending on dish type/ingredients (High-GI carbohydrates take precedence)
    if any(k in name_lower or k in ingredients_str for k in ["sugar", "jaggery", "honey", "sweet", "syrup", "halwa", "laddu", "gulab jamun", "jalebi", "kheer", "barfi", "dessert", "cake", "pastry", "chocolate"]):
        base_gi = 80  # High simple sugars / desserts
    elif any(k in name_lower or k in ingredients_str for k in ["potato", "aloo", "french fries", "sweet potato"]):
        base_gi = 80  # High starch tubers
    elif any(k in name_lower or k in ingredients_str for k in ["maida", "bhatura", "puri"]):
        base_gi = 75  # Refined flour products
    elif any(k in name_lower or k in ingredients_str for k in ["rice", "pulao", "biryani", "khichdi", "rice flakes", "murmura", "poha", "white bread", "bun", "toast", "sandwich"]):
        if "brown rice" in name_lower or "brown rice" in ingredients_str:
            base_gi = 55  # Medium-GI whole grain
        elif "whole wheat" in name_lower or "whole wheat" in ingredients_str or "multigrain" in name_lower or "multigrain" in ingredients_str:
            base_gi = 55  # Medium-GI whole grain
        else:
            base_gi = 70  # High-GI white rice / refined starch
    elif any(k in name_lower or k in ingredients_str for k in ["soda", "lemonade", "juice", "shake", "milkshake", "cooler", "punch", "lassi", "tea", "coffee"]):
        base_gi = 65  # Simple beverages
    elif any(k in name_lower or k in ingredients_str for k in ["whole wheat", "multigrain", "atta", "roti", "chapati", "oat", "oatmeal", "dalia", "barley", "quinoa", "porridge", "semolina", "suji", "upma", "idli", "dosa"]):
        base_gi = 55  # Medium-GI complex carbs
    elif any(k in name_lower or k in ingredients_str for k in ["banana", "apple", "mango", "pineapple", "grape", "orange", "fruit"]):
        base_gi = 50  # Fruits (Low-Medium GI)
    elif any(k in name_lower or k in ingredients_str for k in ["lentil", "dal", "chana", "rajma", "beans", "chickpeas", "peas"]):
        base_gi = 40  # Pulses / Legumes (Low GI)
    elif any(k in name_lower or k in ingredients_str for k in ["milk", "curd", "yogurt"]):
        base_gi = 35  # Dairy (Low GI)
    elif any(k in name_lower or k in ingredients_str for k in ["cucumber", "spinach", "broccoli", "leafy", "cabbage", "cauliflower", "lettuce", "tomato", "onion"]):
        base_gi = 25  # Fibrous low-starch veggies
    elif any(k in name_lower or k in ingredients_str for k in ["paneer", "egg", "chicken", "fish", "mutton", "meat", "tofu", "nuts", "seeds", "butter", "ghee", "oil"]):
        base_gi = 20  # Proteins / Fats (Nearly zero carbs)
    else:
        base_gi = 55  # Default/moderate carb baseline

    # 3. Macro-nutritional refinements
    total_non_carb = protein + fats
    
    if total_non_carb > 0:
        ratio = carbs / total_non_carb
        if ratio > 4.0:
            # Extremely heavy in carbs relative to protein/fat
            base_gi += 8
        elif ratio < 1.0:
            # High protein/fat relative to carbs slows digestion and lowers GI
            base_gi -= 10
        elif ratio < 2.0:
            # Moderate protein/fat slows digestion slightly
            base_gi -= 5
            
    # Adjust for simple sugar content
    if sugar > 10:
        base_gi += 6
    elif carbs > 0 and sugar > 0 and (sugar / carbs) < 0.1:
        # High complex carbs, low simple sugar
        base_gi -= 4

    # Clamp the values in realistic ranges (15 to 100)
    gi_value = max(15, min(100, round(base_gi)))

    # 4. Categorize Glycemic Index
    if gi_value <= 55:
        gi_category = "Low"
    elif gi_value <= 69:
        gi_category = "Medium"
    else:
        gi_category = "High"

    return gi_value, gi_category
