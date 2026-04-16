import os
from openai import OpenAI
from dotenv import load_dotenv

# Load .env from project root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, '..', '.env'))

class MealAgent:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        self.model = "gpt-4o-mini"
        
        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                print(f"AI Client Initialization Failed: {e}")

    def generate_daily_insights(self, profile, daily_plan):
        """
        Generate professional nutritional insights for a full day of meals.
        """
        # Fallback if AI client is not available or key is missing
        if not self.client:
            return {slot: f"Professional {slot} pick from your selected region." for slot in daily_plan.keys()}

        # Construct specific context for the AI
        profile_context = (
            f"User Profile: {profile.get('age')} year old {profile.get('gender')}. "
            f"Current Weight: {profile.get('weight')}kg, Height: {profile.get('height')}cm. "
            f"Goal: {profile.get('dietary_goal', 'Healthy Eating')}. "
            f"Dietary Preference: {profile.get('dietary_type', 'Both')}. "
            f"Region: {profile.get('region', 'J&K')}. "
        )

        meals_text = ""
        for slot, dish in daily_plan.items():
            meals_text += f"- {slot.capitalize()}: {dish['name']} ({dish['macros']['calories']} kcal, {dish['macros']['protein']}g P, {dish['macros']['carbs']}g C, {dish['macros']['fat']}g F)\n"

        prompt = f"""
        You are a Professional Indian Clinical Nutritionist Agent. 
        Analyze the following daily meal plan for a user with these biometrics:
        {profile_context}

        The proposed meals are:
        {meals_text}

        For EACH meal slot, provide a ONE-SENTENCE professional nutritional insight (max 20 words). 
        The insight should explain WHY this specific dish is good for their specific goal (e.g. Muscle Gain, Weight Loss).
        Be professional, scientific, but encouraging. Focus on Indian nutritional context.

        Return the response in this exact format:
        Breakfast: [Insight]
        Lunch: [Insight]
        Snacks: [Insight]
        Dinner: [Insight]
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a highly accurate Indian Nutritionist Agent. You only provide scientific, meal-specific insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )

            results_text = response.choices[0].message.content.strip()
            
            # Simple parsing of the response
            insights = {}
            lines = results_text.split('\n')
            for line in lines:
                if ':' in line:
                    slot, insight = line.split(':', 1)
                    insights[slot.strip().lower()] = insight.strip()
            
            return insights

        except Exception as e:
            print(f"AI Agent Error: {e}")
            return {}
