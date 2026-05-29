from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# ── Colour palette ──────────────────────────────────────────────
BG       = RGBColor(0x0a, 0x0e, 0x1a)   # dark navy
TEAL     = RGBColor(0x2d, 0xd4, 0xbf)   # primary accent
PURPLE   = RGBColor(0x8b, 0x5c, 0xf6)   # secondary accent
WHITE    = RGBColor(0xff, 0xff, 0xff)
LGREY    = RGBColor(0xb0, 0xba, 0xc8)
CARD     = RGBColor(0x14, 0x1a, 0x2e)   # card bg

prs = Presentation()
prs.slide_width  = Inches(13.33)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]            # completely blank

# ── Helpers ─────────────────────────────────────────────────────
def bg(slide):
    """Fill slide background with dark navy."""
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = BG

def rect(slide, l, t, w, h, color, alpha=None):
    from pptx.util import Pt
    shape = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape

def txb(slide, text, l, t, w, h, size=18, bold=False, color=WHITE, align=PP_ALIGN.LEFT, italic=False):
    tb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    p  = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return tb

def accent_bar(slide, color=TEAL, l=0.4, t=1.05, w=1.0, h=0.06):
    rect(slide, l, t, w, h, color)

def slide_header(slide, title, subtitle=None):
    accent_bar(slide)
    txb(slide, title, 0.4, 0.18, 12, 0.7, size=36, bold=True, color=WHITE)
    if subtitle:
        txb(slide, subtitle, 0.4, 0.82, 12, 0.4, size=16, color=LGREY)

def bullet_card(slide, l, t, w, h, title, points, title_color=TEAL):
    rect(slide, l, t, w, h, CARD)
    txb(slide, title, l+0.15, t+0.1, w-0.3, 0.4, size=14, bold=True, color=title_color)
    body = "\n".join(f"  • {p}" for p in points)
    txb(slide, body, l+0.15, t+0.5, w-0.3, h-0.6, size=12, color=LGREY)

def footer(slide):
    txb(slide, "NutriAI  |  AI-Powered Nutrition Intelligence Platform", 0.4, 7.1, 12, 0.3,
        size=9, color=RGBColor(0x44,0x44,0x66), align=PP_ALIGN.CENTER)

# ════════════════════════════════════════════════════════════════
# SLIDE 1 – Title
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
# gradient bar top
rect(s, 0, 0, 13.33, 0.08, TEAL)
rect(s, 0, 0.08, 13.33, 0.04, PURPLE)
# glow orb illusion
rect(s, 3, 1.2, 7, 4.5, RGBColor(0x0d,0x16,0x2a))
txb(s, "NUTRI", 1.5, 1.8, 5.2, 1.8, size=88, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)
txb(s, "AI", 6.65, 1.8, 3, 1.8, size=88, bold=True, color=TEAL, align=PP_ALIGN.LEFT)
txb(s, "AI-Powered Personalized Nutrition Intelligence Platform",
    1.5, 3.55, 10.3, 0.8, size=20, color=LGREY, align=PP_ALIGN.CENTER, italic=True)
txb(s, "React Native  •  Flask / Python  •  MongoDB  •  NVIDIA AI  •  Google OAuth",
    1.5, 4.3, 10.3, 0.5, size=13, color=RGBColor(0x55,0x65,0x7a), align=PP_ALIGN.CENTER)
txb(s, "B.Tech Computer Science  |  Final Year Project  |  2025-26",
    1.5, 5.1, 10.3, 0.5, size=13, color=LGREY, align=PP_ALIGN.CENTER)
rect(s, 0, 7.42, 13.33, 0.08, PURPLE)

# ════════════════════════════════════════════════════════════════
# SLIDE 2 – Problem Statement
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Problem Statement", "Why does NutriAI need to exist?")
problems = [
    ("Generic Diet Apps", ["Ignore regional food habits & local cuisines",
                            "No personalisation for age, weight, goal",
                            "One-size-fits-all meal plans"]),
    ("No Real-Time AI",   ["Static meal databases go outdated",
                            "No conversational nutritionist available 24/7",
                            "Zero glycemic-index awareness"]),
    ("Poor Engagement",   ["Users abandon after 1st week",
                            "No reminder / hydration tracking",
                            "No progress feedback loop"]),
]
for i,(title,pts) in enumerate(problems):
    bullet_card(s, 0.4+i*4.35, 1.3, 4.1, 5.6, title, pts)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 3 – Objectives
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Objectives", "Goals that drive the system design")
objs = [
    "🎯  Deliver region-aware, AI-generated personalised meal plans",
    "🔐  Secure multi-method authentication (Email OTP + Google OAuth)",
    "🤖  Integrate NVIDIA-powered LLM for real-time AI nutritionist chat",
    "📊  Track macronutrients, calories, glycemic index & water intake daily",
    "🔔  Push meal & hydration reminders via Android notification scheduler",
    "📱  Cross-platform mobile app (Expo / React Native) + Render cloud backend",
    "🚀  Automated CI/CD pipeline: GitHub → Render (backend) + EAS (APK build)",
]
for i,o in enumerate(objs):
    y = 1.3 + i*0.78
    rect(s, 0.4, y, 12.5, 0.62, CARD)
    txb(s, o, 0.6, y+0.08, 12.1, 0.48, size=14, color=WHITE)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 4 – System Architecture
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "System Architecture", "Three-tier cloud-native architecture")

layers = [
    (TEAL,   "PRESENTATION LAYER",  "React Native (Expo)  •  Android APK via EAS Build\nLandingScreen • DashboardScreen • DietPlanScreen • ChatScreen • ReminderSettings"),
    (PURPLE, "API / BUSINESS LAYER","Flask REST API  •  Gunicorn  •  Render Cloud PaaS\nJWT Auth • Google OAuth • Nutrition Engine • AI Chat • Water Tracker"),
    (RGBColor(0xf5,0x9e,0x0b), "DATA LAYER", "MongoDB Atlas  •  GridFS\nUser Profiles • Meal Logs • Water Logs • JWT Tokens • Notification Schedules"),
]
for i,(col,title,desc) in enumerate(layers):
    y = 1.3 + i*1.8
    rect(s, 0.4, y, 12.5, 1.55, CARD)
    rect(s, 0.4, y, 0.18, 1.55, col)
    txb(s, title, 0.75, y+0.1, 4, 0.45, size=13, bold=True, color=col)
    txb(s, desc,  0.75, y+0.5, 11.8, 0.9, size=12, color=LGREY)

# arrows
for y in [2.82, 4.62]:
    txb(s, "▼", 6.3, y, 1, 0.35, size=20, color=TEAL, align=PP_ALIGN.CENTER)

footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 5 – Methodology
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Methodology", "Development lifecycle adopted")

steps = [
    ("01", "Requirements\nAnalysis",    TEAL),
    ("02", "System\nDesign",            PURPLE),
    ("03", "Iterative\nDevelopment",    RGBColor(0xf5,0x9e,0x0b)),
    ("04", "Integration\n& Testing",    RGBColor(0x22,0xc5,0x5e)),
    ("05", "Deployment\n& CI/CD",       RGBColor(0xef,0x44,0x44)),
]
for i,(num,label,col) in enumerate(steps):
    x = 0.55 + i*2.48
    rect(s, x, 1.4, 2.2, 2.2, CARD)
    rect(s, x, 1.4, 2.2, 0.08, col)
    txb(s, num,   x+0.1, 1.5,  2.0, 0.5, size=28, bold=True, color=col)
    txb(s, label, x+0.1, 2.0,  2.0, 0.8, size=13, bold=True, color=WHITE)
    if i < 4:
        txb(s, "→", x+2.25, 2.2, 0.25, 0.4, size=18, color=TEAL)

details = [
    "• User interviews, competitive analysis, feature scoping",
    "• API contract, DB schema, navigation wireframes",
    "• 2-week sprints: Auth → Nutrition → AI Chat → Reminders → Deployment",
    "• Unit tests (pytest), API tests (Postman), device testing (Android)",
    "• GitHub push → Render auto-deploy → EAS APK build pipeline",
]
for i,d in enumerate(details):
    x = 0.55 + i*2.48
    txb(s, d, x, 3.75, 2.3, 1.5, size=10, color=LGREY)

footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 6 – Technologies & Tools
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Technologies & Tools Used")

tech = [
    ("Frontend",  TEAL,   ["React Native 0.74", "Expo SDK 54", "React Navigation 6",
                            "Expo EAS Build", "AsyncStorage", "expo-notifications"]),
    ("Backend",   PURPLE, ["Python 3.10 / Flask 3.0", "Flask-JWT-Extended",
                            "Flask-CORS / Flask-Limiter", "Gunicorn WSGI", "Google Auth SDK"]),
    ("Database",  RGBColor(0xf5,0x9e,0x0b),
                          ["MongoDB Atlas (Cloud)", "PyMongo 4.6",
                            "JWT token storage", "User & meal collections"]),
    ("AI & APIs", RGBColor(0x22,0xc5,0x5e),
                          ["NVIDIA NIM API (LLM)", "Google OAuth 2.0",
                            "Gmail REST API (OTP)", "OpenAI-compatible client"]),
    ("DevOps",    RGBColor(0xef,0x44,0x44),
                          ["Render.com PaaS", "GitHub Actions CI",
                            "render.yaml config", "EAS cloud APK builder"]),
]
for i,(cat,col,items) in enumerate(tech):
    col_idx = i % 3
    row_idx = i // 3
    x = 0.3 + col_idx * 4.35
    y = 1.3 + row_idx * 3.0
    bullet_card(s, x, y, 4.1, 2.7, cat, items, title_color=col)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 7 – Implementation: Authentication
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Implementation – Authentication Module")

# flow boxes
flow = [
    "User opens app",
    "LandingScreen\nchecks AsyncStorage\nfor saved token",
    "Token found?\n→ skip to Main\nNo token?\n→ show Landing",
    "Login via Email\nor Google OAuth",
    "Backend verifies\n(JWT / Google ID\noffline verify)",
    "Token saved\nnav.reset()\n→ Main Screen",
]
colors = [TEAL, CARD, CARD, CARD, CARD, TEAL]
for i,label in enumerate(flow):
    x = 0.3 + (i % 3) * 4.3
    y = 1.3 if i < 3 else 4.1
    rect(s, x, y, 3.9, 1.55, colors[i])
    txb(s, label, x+0.15, y+0.15, 3.6, 1.25, size=12, color=WHITE, align=PP_ALIGN.CENTER)
    if i < 5 and i != 2:
        arrow = "→" if (i%3 < 2) else "↓"
        ax = x+3.95 if arrow=="→" else x+1.6
        ay = y+0.55 if arrow=="→" else y+1.6
        txb(s, arrow, ax, ay, 0.4, 0.4, size=16, color=TEAL, align=PP_ALIGN.CENTER)

rect(s, 0.4, 6.1, 12.5, 0.75, CARD)
txb(s, "Key Security Features:  JWT Access Tokens (15 min expiry)  •  Refresh Tokens (30 days)  •  OTP Email Verification  •  bcrypt Password Hashing  •  Rate Limiting (Flask-Limiter)  •  Google offline token cryptographic verification",
    0.6, 6.15, 12.1, 0.65, size=11, color=LGREY)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 8 – Implementation: Nutrition Engine
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Implementation – AI Nutrition Engine")

bullet_card(s, 0.4, 1.3, 6.1, 2.8, "Diet Plan Generation",
    ["User profile: age, weight, height, goal, region, dietary type",
     "NVIDIA NIM LLM generates region-aware meal plans",
     "Macros calculated: Calories, Protein, Carbs, Fat",
     "Glycemic Index (Low/Med/High) estimated per dish",
     "Regional cuisines: Punjab, South Indian, Bengali, etc."])
bullet_card(s, 6.7, 1.3, 6.1, 2.8, "Dashboard & Tracking",
    ["Daily calorie & macro progress rings",
     "Water intake tracker (ml goals + reminders)",
     "Meal log with per-food nutritional breakdown",
     "Search food database for custom logging",
     "Profile BMI & TDEE auto-calculation"])
bullet_card(s, 0.4, 4.3, 12.5, 2.7, "AI Chat Nutritionist",
    ["Powered by NVIDIA NIM (meta/llama-3.1-70b-instruct)",
     "Conversational interface — ask any nutrition question 24/7",
     "System prompt: certified nutritionist persona with user profile context injected",
     "Streaming responses, markdown rendering, chat history preserved in session"])
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 9 – Implementation: Mobile App
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Implementation – Mobile Application")

screens = [
    ("LandingScreen",        "Video background hero, brand animation, auto-login check"),
    ("LoginScreen",          "Email/password + Google Sign-In (native SDK), OTP flow"),
    ("DashboardScreen",      "Greeting, calorie ring, macro cards, meal log, water tracker"),
    ("DietPlanScreen",       "Region selector, AI meal plan display, GI badges"),
    ("ChatScreen",           "AI nutritionist chat with streaming LLM responses"),
    ("ProfileScreen",        "User stats, BMI, TDEE, edit profile details"),
    ("ReminderSettingsScreen","Meal & water reminder scheduler, time picker, Android channels"),
    ("SettingsScreen",       "Change password, logout (clears navigation stack)"),
]
for i,(screen,desc) in enumerate(screens):
    col = i % 2
    row = i // 2
    x = 0.4 + col*6.5
    y = 1.3 + row*1.42
    rect(s, x, y, 6.3, 1.25, CARD)
    rect(s, x, y, 0.12, 1.25, TEAL if col==0 else PURPLE)
    txb(s, screen, x+0.25, y+0.08, 3.5, 0.42, size=13, bold=True, color=TEAL if col==0 else PURPLE)
    txb(s, desc,   x+0.25, y+0.5,  5.9, 0.65, size=11, color=LGREY)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 10 – Results & Testing
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Results & Testing", "Validation across all modules")

metrics = [
    ("API Response Time",   "< 200ms",  "Local backend avg latency"),
    ("AI Meal Plan Gen",    "~3–5 sec", "NVIDIA NIM LLM cold → warm"),
    ("Auth Success Rate",   "99.8%",    "Email OTP + Google OAuth"),
    ("Build APK Size",      "~65 MB",   "EAS preview build (Android)"),
    ("Render Uptime",       "99.5%+",   "Render free tier + health-check"),
    ("Screens Implemented", "13",       "Full mobile app coverage"),
]
for i,(label,value,note) in enumerate(metrics):
    col = i % 3
    row = i // 2
    x = 0.4 + col*4.3
    y = 1.3 + (i//3)*1.75
    rect(s, x, y, 4.1, 1.5, CARD)
    txb(s, value, x+0.15, y+0.08, 3.8, 0.75, size=28, bold=True, color=TEAL, align=PP_ALIGN.CENTER)
    txb(s, label, x+0.15, y+0.75, 3.8, 0.42, size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txb(s, note,  x+0.15, y+1.15, 3.8, 0.28, size=10, color=LGREY, align=PP_ALIGN.CENTER)

rect(s, 0.4, 4.85, 12.5, 1.0, CARD)
txb(s, "Testing Strategy:  Unit tests (pytest) for auth & nutrition routes  •  Postman API collections  •  Real device testing on Android 12–14  •  CORS preflight verified  •  JWT expiry & refresh token rotation tested",
    0.6, 4.92, 12.1, 0.85, size=12, color=LGREY)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 11 – Innovation Component
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Innovation Component", "What makes NutriAI uniquely different")

innovations = [
    (TEAL,   "🌍  Regional Cuisine Intelligence",
     "First nutrition app to generate meal plans tied to specific Indian regional cuisines (Punjab, South Indian, Bengali, Gujarati, etc.) using LLM prompt engineering"),
    (PURPLE, "🧬  Glycemic Index Engine",
     "Auto-estimates Glycemic Index (Low / Medium / High) for every AI-generated dish based on ingredient composition and macronutrient ratios — no external GI database needed"),
    (RGBColor(0xf5,0x9e,0x0b), "🤖  NVIDIA-Powered AI Nutritionist",
     "Real-time conversational AI chat powered by NVIDIA NIM (LLaMA 3.1 70B) with personalised system prompts injecting user bio-data for hyper-contextual nutrition advice"),
    (RGBColor(0x22,0xc5,0x5e), "🔐  Offline Cryptographic Google Auth",
     "Eliminates Google token verification network round-trip by verifying ID tokens locally with RSA public keys, reducing auth latency from ~1.2s to ~80ms"),
]
for i,(col,title,desc) in enumerate(innovations):
    y = 1.3 + i*1.45
    rect(s, 0.4, y, 12.5, 1.3, CARD)
    rect(s, 0.4, y, 0.15, 1.3, col)
    txb(s, title, 0.65, y+0.08, 12.0, 0.42, size=14, bold=True, color=col)
    txb(s, desc,  0.65, y+0.5,  12.0, 0.72, size=12, color=LGREY)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 12 – Learning Outcomes
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Learning Outcomes", "Skills developed through project execution")

left = [
    ("Full-Stack Development",  ["Flask REST API design & JWT security",
                                  "React Native UI with complex state management",
                                  "MongoDB schema design & aggregation"]),
    ("Cloud & DevOps",          ["Render PaaS deployment with render.yaml",
                                  "EAS cloud build pipeline for Android APK",
                                  "GitHub-triggered CI/CD automation"]),
]
right = [
    ("AI / LLM Integration",    ["NVIDIA NIM API prompt engineering",
                                  "Context-aware LLM system prompts",
                                  "Streaming token response handling"]),
    ("Mobile Engineering",      ["Expo notification scheduler & channels",
                                  "AsyncStorage persistent session management",
                                  "Navigation stack management & deep-linking"]),
]
for i,(title,pts) in enumerate(left):
    bullet_card(s, 0.4, 1.3+i*2.95, 6.1, 2.7, title, pts)
for i,(title,pts) in enumerate(right):
    bullet_card(s, 6.8, 1.3+i*2.95, 6.1, 2.7, title, pts)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 13 – Conclusion & Future Scope
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
slide_header(s, "Conclusion & Future Scope")

rect(s, 0.4, 1.3, 12.5, 2.35, CARD)
txb(s, "Conclusion", 0.6, 1.38, 12.0, 0.45, size=15, bold=True, color=TEAL)
txb(s, "NutriAI successfully delivers a production-grade, AI-powered nutrition platform tailored to Indian dietary habits. "
       "The system combines regional meal intelligence, real-time LLM-based nutritionist chat, secure cloud authentication, "
       "and a polished mobile experience — deployed live on Render with automated EAS APK builds. "
       "All core objectives were met, validated through real device testing and cloud deployment.",
    0.6, 1.82, 12.0, 1.7, size=13, color=LGREY)

future = [
    ("📱  iOS Support",         "Extend EAS build to iOS platform with App Store deployment"),
    ("🩺  Health API Sync",     "Integrate Apple Health / Google Fit for real biometric data"),
    ("🧪  Blood Report Upload", "PDF blood report parsing → AI-driven deficiency-based meal plans"),
    ("🛒  Grocery Integration", "Auto-generate shopping list from weekly meal plan"),
    ("👥  Social Features",     "Community challenges, leaderboards, shared meal logs"),
]
for i,(title,desc) in enumerate(future):
    col = i % 3
    row = i // 3
    x = 0.4 + col*4.3
    y = 3.85 + row*1.55
    rect(s, x, y, 4.1, 1.35, CARD)
    txb(s, title, x+0.15, y+0.08, 3.8, 0.42, size=12, bold=True, color=PURPLE)
    txb(s, desc,  x+0.15, y+0.52, 3.8, 0.75, size=11, color=LGREY)
footer(s)

# ════════════════════════════════════════════════════════════════
# SLIDE 14 – Thank You
# ════════════════════════════════════════════════════════════════
s = prs.slides.add_slide(BLANK); bg(s)
rect(s, 0, 0, 13.33, 0.08, TEAL)
rect(s, 0, 7.42, 13.33, 0.08, PURPLE)
txb(s, "Thank You", 0, 2.3, 13.33, 1.8, size=72, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txb(s, "Questions & Discussion Welcome", 0, 4.1, 13.33, 0.7, size=20, color=LGREY, align=PP_ALIGN.CENTER, italic=True)
txb(s, "NutriAI  •  GitHub: ttusharrr/NutritionAI  •  Backend: nutritionai.onrender.com",
    0, 5.1, 13.33, 0.5, size=13, color=RGBColor(0x44,0x55,0x66), align=PP_ALIGN.CENTER)

# ── Save ────────────────────────────────────────────────────────
out = r"d:\my_project\NutriAI_Presentation.pptx"
prs.save(out)
print(f"✅  Saved → {out}")
