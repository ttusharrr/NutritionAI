import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.nutrition_calc import calculate_daily_requirements
from utils.nutrition_matcher import get_recommendations

# Sample profile
profile = {
    "age": 25,
    "gender": "male",
    "weight": 70, # kg
    "height": 175, # cm
    "activity_level": "moderate",
    "dietary_goal": "gain_muscle",
    "region": "Punjab",
    "dietary_type": "Veg"
}

# 1. Project targets
targets = calculate_daily_requirements(profile)
print("=== PROJECT TARGET CALCULATION ===")
print(f"Calories: {targets['daily_calories']} kcal")
print(f"Protein: {targets['macros']['protein']}g")
print(f"Carbs: {targets['macros']['carbs']}g")
print(f"Fat: {targets['macros']['fat']}g")
print(f"BMI: {targets['bmi_data']['value']} ({targets['bmi_data']['status']})")

# 2. Get recommendation sample for breakfast
slots = {
    "breakfast": 0.20,
    "lunch": 0.30,
    "snacks": 0.10,
    "dinner": 0.25,
}

print("\n=== PROJECT MEAL MATCHING ===")
exclude_ids = []
for slot, ratio in slots.items():
    slot_macros = {
        "protein": targets['macros']['protein'] * ratio,
        "carbs": targets['macros']['carbs'] * ratio,
        "fat": targets['macros']['fat'] * ratio
    }
    slot_filters = {
        "type": "Veg",
        "meal_type": slot,
        "region": "Punjab",
        "allergies": [],
        "diseases": []
    }
    recs = get_recommendations(slot_macros, region="All", filters=slot_filters, exclude_ids=exclude_ids, top_n=1)
    if recs:
        rec = recs[0]
        exclude_ids.append(rec['id'])
        nutrients = rec.get('scaled_nutrients', rec['nutrients'])
        print(f"\n[{slot.upper()}]: {rec['name']}")
        print(f"Quantity: {round(rec.get('base_serving_g', 100) * rec.get('scale_multiplier', 1))}g")
        print(f"Macros: Cals={round(nutrients['calories'])}kcal, P={round(nutrients['protein'])}g, C={round(nutrients['carbs'])}g, F={round(nutrients['fats'])}g")
