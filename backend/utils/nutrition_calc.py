"""Nutrition calculation utility — Mifflin-St Jeor & Dynamic Macros."""

def calculate_daily_requirements(profile):
    """
    Calculate daily calorie and macro requirements based on user profile.
    
    Formula: Mifflin-St Jeor Equation
    Men: (10 * weight) + (6.25 * height) - (5 * age) + 5
    Women: (10 * weight) + (6.25 * height) - (5 * age) - 161
    """
    age = profile.get("age")
    gender = profile.get("gender", "male")
    weight = profile.get("weight")  # in kg
    height = profile.get("height")  # in cm
    activity_level = profile.get("activity_level", "sedentary")
    dietary_goal = profile.get("dietary_goal", "maintain")

    # If any required biometric is missing, return default dummy values
    if not all([age, weight, height]):
        return {
            "daily_calories": 2000,
            "macros": {
                "protein": 125,
                "carbs": 225,
                "fat": 67
            }
        }

    # 1. Calculate BMR
    if gender == "female":
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    else:
        # Default to male / other
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5

    # 2. Apply Activity Multiplier
    multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "very_active": 1.725,
        "extreme": 1.9
    }
    tdee = bmr * multipliers.get(activity_level, 1.2)

    # 3. Apply Dietary Goal Adjustments
    # Industry standard adjustments
    goal_adjustments = {
        "maintain": 0,
        "lose_weight": -500,
        "gain_muscle": 400,
        "eat_healthy": 0
    }
    daily_calories = int(tdee + goal_adjustments.get(dietary_goal, 0))

    # Safety minimum (Ensure we don't go below dangerous levels)
    min_calories = 1200 if gender == "female" else 1500
    daily_calories = max(daily_calories, min_calories)

    # 4. Dynamic Macro Ratios (Customized for Industry Readiness)
    # Ratio format: (Protein %, Carbs %, Fat %)
    ratios = {
        "maintain": (0.25, 0.45, 0.30),
        "lose_weight": (0.35, 0.35, 0.30), # Higher protein for satiety and muscle retention
        "gain_muscle": (0.30, 0.50, 0.20), # High carb for energy, high protein for growth
        "eat_healthy": (0.25, 0.50, 0.25)
    }
    
    p_ratio, c_ratio, f_ratio = ratios.get(dietary_goal, ratios["maintain"])

    # Calculate grams
    # Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
    protein_g = int((daily_calories * p_ratio) / 4)
    carbs_g = int((daily_calories * c_ratio) / 4)
    fat_g = int((daily_calories * f_ratio) / 9)

    # 5. Calculate BMI
    bmi = weight / ((height / 100) ** 2)
    bmi_status = "Normal"
    if bmi < 18.5:
        bmi_status = "Underweight"
    elif bmi < 25:
        bmi_status = "Normal"
    elif bmi < 30:
        bmi_status = "Overweight"
    else:
        bmi_status = "Obese"

    return {
        "daily_calories": daily_calories,
        "macros": {
            "protein": protein_g,
            "carbs": carbs_g,
            "fat": fat_g
        },
        "bmi_data": {
            "value": round(bmi, 1),
            "status": bmi_status
        }
    }

