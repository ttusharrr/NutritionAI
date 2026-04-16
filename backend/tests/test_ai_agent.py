import os
import sys
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from utils.ai_agent import MealAgent

load_dotenv()

def test_ai_agent():
    print("Testing MealAgent...")
    agent = MealAgent()
    
    profile = {
        "age": 28,
        "gender": "male",
        "weight": 75,
        "height": 180,
        "dietary_goal": "gain_muscle",
        "dietary_type": "Both",
        "region": "J&K"
    }
    
    daily_plan = {
        "breakfast": {
            "name": "Harissa",
            "macros": {"calories": 220, "protein": 10, "carbs": 18, "fat": 10}
        },
        "lunch": {
            "name": "Rogan Josh",
            "macros": {"calories": 277, "protein": 13, "carbs": 1, "fat": 24}
        }
    }
    
    insights = agent.generate_daily_insights(profile, daily_plan)
    print("\nAI Insights:")
    for slot, insight in insights.items():
        print(f"{slot.capitalize()}: {insight}")

if __name__ == "__main__":
    test_ai_agent()
