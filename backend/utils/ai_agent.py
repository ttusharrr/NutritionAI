import os
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from project root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '..', '.env'))

class MealAgent:
    def __init__(self):
        self.api_key = os.getenv("NVIDIA_API_KEY")
        self.client = None
        self.model = "meta/llama-3.1-8b-instruct"
        
        if self.api_key:
            try:
                self.client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=self.api_key
                )
            except Exception as e:
                print(f"AI Client Initialization Failed: {e}")

    def generate_daily_insights(self, profile, daily_plan):
        """
        Generate professional nutritional insights and extract the core raw ingredient.
        Returns JSON: { "breakfast": {"insight": "...", "core_item": "..."}, ... }
        """
        if not self.client:
            return {slot: {"insight": f"Professional {slot} pick.", "core_item": "Healthy Food"} for slot in daily_plan.keys()}

        profile_context = (
            f"User Profile: {profile.get('age')} year old {profile.get('gender')}. "
            f"Current Weight: {profile.get('weight')}kg, Height: {profile.get('height')}cm. "
            f"Goal: {profile.get('dietary_goal', 'Healthy Eating')}. "
            f"Dietary Preference: {profile.get('dietary_type', 'Both')}."
        )

        meals_text = ""
        for slot, dish in daily_plan.items():
            # Handle both formats (if items exist or just name)
            dish_name = dish['name'] if 'name' in dish else (' + '.join([i['name'] for i in dish.get('items', [])]) if 'items' in dish else 'Meal')
            meals_text += f"- {slot}: {dish_name}\n"

        prompt = f"""
        You are an Indian Clinical Nutritionist. 
        User Biometrics: {profile_context}
        Meals:
        {meals_text}

        For EACH meal slot, provide:
        1. A ONE-SENTENCE nutritional insight explaining why the dish supports the user's goal.
        2. The primary raw base ingredient / food product the dish is made from (e.g., 'Chicken', 'Lentils', 'Oats', 'Lamb', 'Rice').

        Return ONLY a raw JSON object with NO markdown formatting:
        {{
            "breakfast": {{"insight": "Supports metabolism...", "core_item": "Oats"}},
            "lunch": {{"insight": "High protein...", "core_item": "Lamb"}},
            "snacks": {{"insight": "Energy boost...", "core_item": "Apples"}},
            "dinner": {{"insight": "Light recovery...", "core_item": "Lentils"}}
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a JSON generator. Output pure JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=400
            )

            import json
            result_text = response.choices[0].message.content.strip()
            if result_text.startswith("```json"): result_text = result_text[7:-3].strip()
            elif result_text.startswith("```"): result_text = result_text[3:-3].strip()
            
            return json.loads(result_text)

        except Exception as e:
            print(f"AI Agent Error: {e}")
            return {slot: {"insight": f"Target hit.", "core_item": "Healthy Food"} for slot in daily_plan.keys()}

    def generate_recipe(self, dish_name):
        """Generate a detailed recipe for a given dish using exact JSON format."""
        if not self.client:
            return {"error": "AI client not initialized"}

        prompt = f"""
        You are a Master Indian Chef. Provide a realistic, delicious recipe for '{dish_name}'.
        Return the recipe ONLY as a raw JSON object with NO markdown formatting, NO backticks. Structure:
        {{
            "name": "{dish_name}",
            "prep_time": "15 mins",
            "cook_time": "30 mins",
            "ingredients": ["ingredient 1 (amount)", "ingredient 2"],
            "instructions": ["Step 1", "Step 2"]
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a backend JSON generator. Output ONLY pure JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=600
            )
            import json
            recipe_text = response.choices[0].message.content.strip()
            if recipe_text.startswith("```json"): recipe_text = recipe_text[7:-3].strip()
            elif recipe_text.startswith("```"): recipe_text = recipe_text[3:-3].strip()
            return json.loads(recipe_text)
        except Exception as e:
            return {"error": "Failed to generate recipe"}

    def chat(self, user_message, history, profile):
        """Respond to arbitrary user nutrition queries via Chatbot."""
        if not self.client:
            return "AI client not active."

        # Truncate history to last 5 messages to save tokens
        recent_history = history[-5:] if history else []
        
        messages = [
            {"role": "system", "content": f"You are NutriAI, an expert Indian clinical nutritionist bot. User goal: {profile.get('dietary_goal')}. Diet: {profile.get('dietary_type')}. Be concise, friendly, and helpful."}
        ]
        
        for msg in recent_history:
            messages.append({"role": msg['role'], "content": msg['content']})
            
        messages.append({"role": "user", "content": user_message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=400
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Chatbot Error: {e}")
            return "I'm having trouble connecting to my brain right now. Please try again later."
