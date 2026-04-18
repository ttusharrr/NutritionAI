import pandas as pd
import json
import uuid

# Path to the dataset downloaded by kagglehub
import kagglehub
import os

print("Locating dataset...")
dataset_dir = kagglehub.dataset_download("batthulavinay/indian-food-nutrition")
csv_path = None
for root, dirs, files in os.walk(dataset_dir):
    for f in files:
        if f.endswith('.csv'):
            csv_path = os.path.join(root, f)
            break

if not csv_path:
    print("Error: Could not find CSV file in dataset.")
    exit(1)

print(f"Reading dataset from {csv_path}")
df = pd.read_csv(csv_path)

# Columns: 'Dish Name', 'Calories (kcal)', 'Carbohydrates (g)', 'Protein (g)', 'Fats (g)', etc.

# Heuristics for non-veg
non_veg_keywords = ['chicken', 'mutton', 'beef', 'pork', 'fish', 'egg', 'meat', 'prawn', 'crab', 'omelette', 'keema']
# Heuristics for drinks
drink_keywords = ['tea', 'coffee', 'juice', 'milk', 'lassi', 'shake', 'water']
# Heuristics for snacks
snack_keywords = ['samosa', 'pakora', 'biscuit', 'cake', 'cookie', 'chaat', 'bhel', 'bhujia', 'namkeen', 'snack']
# Heuristics for breakfast
breakfast_keywords = ['poha', 'upma', 'idli', 'dosa', 'paratha', 'oats', 'cornflakes']
# Heuristics for raw/ingredient (if we can infer)
# The dataset mostly contains prepared dishes, but let's assume anything not keyworded heavily is a Dish.

recipes = []

for index, row in df.iterrows():
    name = str(row['Dish Name']).strip()
    name_lower = name.lower()
    
    # Determine Diet Type
    diet_type = "Veg"
    for kw in non_veg_keywords:
        if kw in name_lower:
            diet_type = "Non-Veg"
            break
            
    # Determine Meal Type
    meal_type = "lunch" # default fallback
    if any(kw in name_lower for kw in drink_keywords):
        meal_type = "snack"
    elif any(kw in name_lower for kw in snack_keywords):
        meal_type = "snack"
    elif any(kw in name_lower for kw in breakfast_keywords):
        meal_type = "breakfast"
    else:
        # Give a balanced mix of lunch and dinner
        meal_type = "dinner" if index % 2 == 0 else "lunch"

    rec = {
        "id": f"fd_{uuid.uuid4().hex[:8]}",
        "name": name,
        "type": diet_type,
        "category": "Dish", # Flag as Dish
        "meal_type": meal_type,
        "sub_region": "All", # General India
        "nutrients": {
            "calories": float(row.get('Calories (kcal)', 0)),
            "protein": float(row.get('Protein (g)', 0)),
            "carbs": float(row.get('Carbohydrates (g)', 0)),
            "fats": float(row.get('Fats (g)', 0))
        },
        "base_serving_g": 100, # Dataset is generally per 100g
        "ingredients": ["Kaggle Reference"]
    }
    recipes.append(rec)

# Keep the original J&K recipes but format them properly
try:
    jk_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'jk_recipes.json')
    if os.path.exists(jk_path):
        with open(jk_path, 'r') as f:
            jk_data = json.load(f)
            for item in jk_data:
                item['category'] = 'Dish'
                item['base_serving_g'] = 250 # Assuming original recipes were 1 full serving (~250g)
            recipes.extend(jk_data)
except Exception as e:
    print("Could not load original jk_recipes.json:", e)

# Save to new JSON
out_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'indian_food_nutrition.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(recipes, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(recipes)} recipes and saved to {out_path}")
