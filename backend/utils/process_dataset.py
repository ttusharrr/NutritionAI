import pandas as pd
import json
import os
import uuid

def process_excel(file_path, output_path):
    print(f"Reading Excel from {file_path}...")
    df = pd.read_excel(file_path)
    
    # Mapping and cleaning
    df = df.rename(columns={
        'Food Name': 'name',
        'State': 'sub_region',
        'Meal Type': 'meal_type',
        'Calories (kcal)': 'calories',
        'Carbs (g)': 'carbs',
        'Protein (g)': 'protein',
        'Fats (g)': 'fats',
        'Sodium (mg)': 'sodium',
        'Free Sugar (g)': 'sugar',
        'Ingredients': 'ingredients_str'
    })
    
    # Fill NaN values
    df['calories'] = df['calories'].fillna(0)
    df['carbs'] = df['carbs'].fillna(0)
    df['protein'] = df['protein'].fillna(0)
    df['fats'] = df['fats'].fillna(0)
    df['sodium'] = df['sodium'].fillna(0)
    df['sugar'] = df['sugar'].fillna(0)
    df['sub_region'] = df['sub_region'].fillna('All')
    df['meal_type'] = df['meal_type'].fillna('Dish')
    df['ingredients_str'] = df['ingredients_str'].fillna('')

    recipes = []
    
    non_veg_keywords = ['chicken', 'meat', 'fish', 'egg', 'mutton', 'beef', 'pork', 'prawn', 'shrimp', 'crab', 'lamb']
    
    for _, row in df.iterrows():
        ingredients = [i.strip() for i in str(row['ingredients_str']).split(',') if i.strip()]
        
        # Infer type
        is_non_veg = any(kw in str(row['name']).lower() or kw in str(row['ingredients_str']).lower() for kw in non_veg_keywords)
        food_type = "Non-Veg" if is_non_veg else "Veg"
        
        # Normalize meal_type
        raw_m_type = str(row['meal_type']).lower()
        also_consumed = str(row.get('Also_Consumed_As', '')).lower()
        
        if 'breakfast' in raw_m_type or 'breakfast' in also_consumed:
            m_type = 'breakfast'
        elif 'drinks' in raw_m_type:
            m_type = 'drinks'
        elif 'sides' in raw_m_type:
            m_type = 'sides'
        elif 'snack' in raw_m_type:
            m_type = 'snack'
        elif 'lunch' in raw_m_type:
            m_type = 'lunch'
        elif 'dinner' in raw_m_type:
            m_type = 'dinner'
        else:
            m_type = 'lunch' # Default

        recipe = {
            "id": f"fd_{uuid.uuid4().hex[:8]}",
            "name": row['name'],
            "type": food_type,
            "category": "Dish",
            "meal_type": m_type,
            "sub_region": row['sub_region'],
            "nutrients": {
                "calories": float(row['calories']),
                "protein": float(row['protein']),
                "carbs": float(row['carbs']),
                "fats": float(row['fats']),
                "sodium": float(row['sodium']),
                "sugar": float(row['sugar'])
            },
            "base_serving_g": 100,
            "ingredients": ingredients
        }
        recipes.append(recipe)
        
    print(f"Processed {len(recipes)} recipes.")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    input_file = r"C:\Users\HP\Desktop\Indian_Diet_Dataset_v3.xlsx"
    output_file = os.path.join(os.path.dirname(__file__), "..", "data", "indian_food_nutrition.json")
    process_excel(input_file, output_file)
