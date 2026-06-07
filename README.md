# Nutri AI: AI - Based Personalized Nutrition Recommendation System

NutriAI is a state-of-the-art, AI-driven personalized nutrition application. Designed as a cross-platform solution, it consists of a responsive React + Vite web frontend, an Expo (React Native) mobile application, and a high-performance Flask backend. 

The application utilizes a proprietary **5-Layer Recommendation Pipeline** to generate regional meal plans tailored to biometrics, medical conditions, and allergies, dynamically calculating Glycemic Index values and utilizing LLM-driven agentic reasoning.

---

## 🚀 Key Features & Architectural Innovations

### 1. The 5-Layer Recommendation Pipeline
Every nutrition plan undergoes a strict, sequential evaluation process:
```
[Layer 1: Biometrics/Profile] ➔ [Layer 2: Macro Splitter] ➔ [Layer 3: k-NN ML Matcher] ➔ [Layer 4: Constraint Filter] ➔ [Layer 5: LLM Reasoning]
```
*   **Layer 1 (Biometrics/Profile):** Collects age, weight, height, activity level, and dietary goals via a validated biometric onboarding wizard.
*   **Layer 2 (Macro Splitter):** Splits the daily caloric target into precise macronutrient ratios tailored to regional meal slots (Breakfast 20%, Lunch 30%, Snacks 10%, Dinner 25%, Sides 10%, Drinks 5%).
*   **Layer 3 (ML Matcher):** Employs a custom distance metric (k-NN nearest neighbor logic) to match user macro splits with regional dish profiles.
*   **Layer 4 (Constraint Filter):** Automatically filters out dishes containing user allergens or contraindicated by medical conditions (e.g., Blood Pressure, Diabetes, Cholesterol, Thyroid, Kidney Issues).
*   **Layer 5 (Agentic Reasoning):** Enriches raw recommendations with async LLM insights to generate professional meal coaching advice.

### 2. High-Speed Performance & Caching (SWR)
*   **Stale-While-Revalidate (SWR) Local Cache:** The mobile frontend uses `AsyncStorage` caching. On tab focus, the screen loads cached meal plans instantly (**<50ms**), while fetching fresh data from the server in the background.
*   **Cold Start Masking:** Mitigates cloud hosting spin-down delays (Render free tier), ensuring the user never sees a blocking loading screen.

### 3. Asynchronous Recipe Generation & Polling (HTTP 202)
*   To prevent HTTP timeouts during intensive LLM recipe generations, the backend delegates calls to background worker threads, immediately returning an `HTTP 202 Accepted` status.
*   The frontend polls the `/api/nutrition/recipe` endpoint dynamically. Cached results are stored in MongoDB.
*   Gracefully handles rate-limiting (HTTP 429) and network faults as terminal states to prevent infinite retry loops.

### 4. Developer Ergonomics
*   **IP Auto-Configuration (`ip_updater.py`):** Automatically detects your local machine’s IP and rewrites local configuration files on backend boot, allowing seamless web and physical mobile device connectivity.

---

## 🛠️ Technology Stack

| Component | Technology | Primary Role |
| :--- | :--- | :--- |
| **Frontend (Web)** | React 19, Vite, Framer Motion, Google OAuth, Axios | Premium web dashboard, onboarding wizard, interactive tracking |
| **Frontend (Mobile)** | Expo (React Native), React Navigation, AsyncStorage | Cross-platform mobile app, instant-render offline-first views |
| **Backend API** | Flask (Python 3.10), Gunicorn, Flask-JWT-Extended, Flask-Limiter | High-performance API gateway, rate-limiting, auth orchestration |
| **Database** | MongoDB Atlas, PyMongo | User profiles, token blocklist, water logs, and recipe caching |
| **AI/LLM** | NVIDIA NIM / OpenAI API, Gmail SMTP API | Agentic meal reasoning, recipe generation, OTP email delivery |

---

## 📂 Repository Directory Structure

```
NutritionAI/
├── backend/                   # Python Flask Backend Application
│   ├── data/                  # Regional recipe JSON datasets
│   ├── models/                # ML helper classes & database schemas
│   ├── routes/                # Auth, Diag, Nutrition, and Water logs APIs
│   ├── utils/                 # AI agents, Matchers, GI estimators, IP Auto-config
│   ├── config.py              # Central application configuration
│   ├── app.py                 # Application factory & server bootloader
│   ├── render.yaml            # Render Blueprint deployment specification
│   ├── requirements.txt       # Python dependencies list
│   └── .env.example           # Backend environment configuration template
├── mobile_app/                # React Native Expo Mobile Frontend
│   ├── assets/                # Images, fonts, and icons
│   ├── src/                   # Screens, components, hooks, and navigation
│   ├── App.js                 # App entry point and context provider
│   ├── app.json               # Expo configuration manifest
│   └── package.json           # Mobile package and script dependencies
├── src/                       # React Web Frontend Source Code
├── public/                    # Static assets for the web application
├── package.json               # Web application scripts & dependencies
├── vite.config.js             # Vite compiler config
└── .env.example               # Web frontend environment configuration template
```

---

## ⚙️ Setup & Local Installation

### Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (v3.10 or higher)
*   **MongoDB** (running locally or a MongoDB Atlas URI)

---

### Step 1: Backend Setup & Run

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    *   **Windows:**
        ```bash
        python -m venv venv
        venv\Scripts\activate
        ```
    *   **macOS/Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Configure Environment Variables:
    Copy the configuration template and fill in your details:
    ```bash
    cp .env.example .env
    ```
    *Open `.env` and set your `MONGO_URI`, `NVIDIA_API_KEY`, `GOOGLE_CLIENT_ID`, and Gmail SMTP settings for OTP delivery.*
5.  Start the Flask backend:
    ```bash
    python app.py
    ```
    *Note: If running locally in development, the auto-IP updater script will execute, automatically outputting your current local network IP and binding it to your client config.*

---

### Step 2: Web Frontend Setup & Run

1.  From the root directory, install the web dependencies:
    ```bash
    npm install
    ```
2.  Configure Environment Variables:
    Copy the web env template:
    ```bash
    cp .env.example .env
    ```
    *Verify that the `VITE_API_URL` matches the backend endpoint.*
3.  Start the Vite local development server:
    ```bash
    npm run dev
    ```
4.  Open the link shown in your terminal (typically `http://localhost:5173`) in your browser.

---

### Step 3: Mobile App Setup & Run (Expo)

1.  Navigate to the mobile application directory:
    ```bash
    cd mobile_app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Launch the Expo CLI bundler:
    ```bash
    npx expo start
    ```
4.  Run on devices:
    *   **Android:** Press `a` to run in an Android Emulator, or scan the QR code using the Expo Go app.
    *   **iOS:** Press `i` to run in the iOS Simulator, or scan the QR code using your iPhone's camera.

---

## 🌐 Deployment Details

### Backend (Render)
*   The backend is configured to be deployed on **Render** via the provided [render.yaml](file:///d:/my_project/backend/render.yaml) blueprint.
*   **Start Command:** `gunicorn app:app -b 0.0.0.0:$PORT --access-logfile - --error-logfile - --log-level info --timeout 120`
*   **Health Check Endpoint:** Excluded from rate limits (`/api/health`) to prevent continuous restart loops during Render uptime checks.

### Web Frontend (Vercel)
*   The web frontend is ready for static deployment on **Vercel** with route rewriting configured in `vercel.json` to handle React Router navigation.

### Database (MongoDB Atlas)
*   Ensure that network access rules in MongoDB Atlas allow connections from the Render server IP addresses (or allow `0.0.0.0/0` temporarily).

---

## 👥 Evaluation Committee & Collaborator Access

To grant evaluation access to the repository, collaborator permissions have been allocated to the evaluating address:
*   **Email:** `summar.adm@mietjammu.in`

---
*Developed for the NutritionAI Project Submission.*
