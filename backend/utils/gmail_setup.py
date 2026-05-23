# -*- coding: utf-8 -*-
"""
Gmail API OAuth2 Setup Wizard.
Generates a secure token.json by authorizing via browser.
"""

import os
import sys

# Ensure required libraries are installed
try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
except ImportError:
    print("[SETUP ERROR] Please install the required Google OAuth libraries:")
    print("pip install google-auth-oauthlib google-api-python-client google-auth-httplib2")
    sys.exit(1)

# Scope required to send email on behalf of the user
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("=========================================================")
    print("        NutriAI Gmail API OAuth2 Setup Wizard")
    print("=========================================================")
    print("This tool will authorize your application to send OTP emails")
    print("directly via Google's secure HTTPS API.")
    print("\nStep 1: Checking for Google Credentials...")

    # Look for credentials.json in backend/ directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    cred_paths = [
        os.path.join(backend_dir, 'credentials.json'),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'credentials.json'),
    ]

    cred_path = None
    for path in cred_paths:
        if os.path.exists(path):
            cred_path = path
            break

    if not cred_path:
        print("\n[ERROR] 'credentials.json' not found!")
        return

    print(f"[OK] Found credentials at: {cred_path}")
    print("\nStep 2: Starting local authorization flow...")
    print("Opening your default browser for Google authentication...")
    print("Please log in with tushar427sharma@gmail.com and click Allow.\n")

    try:
        flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
        creds = flow.run_local_server(port=0)

        # Save credentials to token.json inside backend/
        token_path = os.path.join(backend_dir, 'token.json')
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

        print("\n" + "="*60)
        print("SUCCESS: Gmail API OAuth2 Authentication Complete!")
        print("="*60)
        print(f"Saved secure token to: {token_path}")
        print("\nNext Step - To deploy to Render:")
        print("1. Open backend/token.json and copy ALL of its text content.")
        print("2. Go to your Render Web Service -> Environment.")
        print("3. Add a new Environment Variable:")
        print("   Key:   GMAIL_TOKEN_JSON")
        print("   Value: (paste the full token.json text here)")
        print("\nNutriAI will now automatically send secure emails via Gmail HTTPS API!")
        print("=========================================================\n")

    except Exception as e:
        print(f"\n[ERROR] Authorization flow failed: {e}")

if __name__ == '__main__':
    main()
