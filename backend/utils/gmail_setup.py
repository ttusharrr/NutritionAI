"""
Gmail API OAuth2 Setup Wizard.
This script guides the developer to authorize their app to send emails
via Gmail API using a local browser flow, generating a secure token.json file.
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
    print("        📧 NutriAI Gmail API OAuth2 Setup Wizard         ")
    print("=========================================================")
    print("This tool will authorize your application to send OTP emails")
    print("directly via Google's secure HTTPS API. This avoids SMTP firewall blocks!")
    print("\nStep 1: Checking for Google Credentials...")

    # Look for credentials.json in backend/ or backend/utils/
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
        print("\n❌ Error: 'credentials.json' not found!")
        print("\nTo generate credentials.json:")
        print("1. Go to Google Cloud Console (https://console.cloud.google.com).")
        print("2. Create a project named 'NutriAI'.")
        print("3. Search for 'Gmail API' and click 'Enable'.")
        print("4. Go to 'APIs & Services' -> 'OAuth consent screen', choose 'External', fill basic details, and add test user 'your_email@gmail.com'.")
        print("5. Go to 'Credentials' -> 'Create Credentials' -> 'OAuth client ID'.")
        print("6. Set Application type to 'Desktop app' and click Create.")
        print("7. Download the JSON file, rename it to 'credentials.json', and save it in your 'backend/' folder.")
        return

    print(f"✅ Found credentials at: {cred_path}")
    print("\nStep 2: Starting local authorization flow...")
    print("Opening your default browser for Google authentication...")

    try:
        flow = InstalledAppFlow.from_client_secrets_file(cred_path, SCOPES)
        creds = flow.run_local_server(port=0)

        # Save credentials to token.json
        token_path = os.path.join(backend_dir, 'token.json')
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

        print("\n" + "="*57)
        print("🎉 SUCCESS: Gmail API OAuth2 Authentication Complete!")
        print("="*57)
        print(f"Saved secure token to: {token_path}")
        print("\nTo deploy this to Render:")
        print("1. Open 'token.json' and copy the entire text contents.")
        print("2. Go to your Render Web Service -> Environment.")
        print("3. Add a new Environment Variable:")
        print("   Key: GMAIL_TOKEN_JSON")
        print("   Value: (Paste the copied token.json text here)")
        print("\nNutriAI will now automatically send secure emails via Gmail's HTTPS API!")
        print("=========================================================\n")

    except Exception as e:
        print(f"\n❌ Error during authorization flow: {e}")

if __name__ == '__main__':
    main()
