"""
Email service using Google Gmail REST API for secure HTTPS email delivery.
This replaces SMTP completely to bypass Render network port restrictions.
"""

import os
import json
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import Config

def get_gmail_service():
    """Build and return the Gmail API client using stored token JSON (HTTPS Port 443)."""
    token_json_str = os.getenv("GMAIL_TOKEN_JSON")
    
    # Fallback to local token.json if env variable is missing
    if not token_json_str:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        token_path = os.path.join(backend_dir, "token.json")
        if os.path.exists(token_path):
            try:
                with open(token_path, "r") as f:
                    token_json_str = f.read()
            except Exception as file_err:
                print(f"[GMAIL API] Failed to read token.json: {file_err}")
                
    if not token_json_str:
        print("\n" + "!"*60)
        print("  [GMAIL API ERROR] Google OAuth token not found!")
        print("  Please run the setup script on your local computer:")
        print("  python backend/utils/gmail_setup.py")
        print("!"*60 + "\n")
        return None
        
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from google.auth.transport.requests import Request
        
        info = json.loads(token_json_str)
        creds = Credentials.from_authorized_user_info(info)
        
        # Auto-refresh the OAuth2 access token if it has expired
        if creds.expired and creds.refresh_token:
            print("[GMAIL API] Access token expired. Refreshing token...")
            creds.refresh(Request())
            # Save refreshed token back to disk if using local file
            if not os.getenv("GMAIL_TOKEN_JSON"):
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                token_path = os.path.join(backend_dir, "token.json")
                with open(token_path, "w") as f:
                    f.write(creds.to_json())
                    
        return build('gmail', 'v1', credentials=creds)
    except ImportError:
        print("\n" + "!"*60)
        print("  [GMAIL API ERROR] Google OAuth/API libraries are not installed!")
        print("  Please run: pip install google-auth-oauthlib google-api-python-client google-auth-httplib2")
        print("!"*60 + "\n")
        return None
    except Exception as e:
        print(f"[GMAIL API ERROR] Failed to load Gmail service: {e}")
        return None

def send_via_gmail_api(to_email, subject, html_content):
    """Send an HTML email via Google Gmail HTTPS API (Port 443)."""
    service = get_gmail_service()
    if not service:
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = "me"  # Gmail API automatically resolves 'me' to the authenticated account
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))
        
        # Base64 urlsafe encode the message
        raw_msg = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
        body = {'raw': raw_msg}
        
        service.users().messages().send(userId='me', body=body).execute()
        print(f"[GMAIL API] Secure email sent successfully to {to_email} via HTTPS REST API (Port 443)")
        return True
    except Exception as e:
        print(f"[GMAIL API ERROR] Failed to send email to {to_email} via HTTPS REST API: {e}")
        return False

def send_otp_email(to_email, otp_code, user_name="there"):
    """Send OTP verification email via Google Gmail API."""
    subject = f"🔐 NutriAI — Your Verification Code: {otp_code}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#0a1128; font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1128; padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(26,26,46,0.95),rgba(10,17,40,0.95)); border:1px solid rgba(45,212,191,0.2); border-radius:24px; padding:48px 40px;">
                        <tr>
                            <td align="center" style="padding-bottom:32px;">
                                <div style="font-size:32px; font-weight:800; background:linear-gradient(135deg,#2dd4bf,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-0.5px;">
                                    NutriAI
                                </div>
                                <div style="color:rgba(255,255,255,0.5); font-size:12px; letter-spacing:2px; margin-top:4px;">
                                    INTELLIGENT NUTRITION
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <h2 style="color:#ffffff; font-size:22px; margin:0 0 8px 0; font-weight:600;">
                                    Hey {user_name} 👋
                                </h2>
                                <p style="color:rgba(255,255,255,0.6); font-size:15px; line-height:1.6; margin:0 0 32px 0;">
                                    Use the verification code below to complete your sign-up. This code expires in <strong style="color:#2dd4bf;">10 minutes</strong>.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding:24px 0;">
                                <div style="background:linear-gradient(135deg,rgba(45,212,191,0.15),rgba(168,85,247,0.15)); border:1px solid rgba(45,212,191,0.3); border-radius:16px; padding:24px 48px; display:inline-block;">
                                    <span style="font-size:36px; font-weight:800; letter-spacing:12px; color:#ffffff; font-family:'Courier New',monospace;">
                                        {otp_code}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="color:rgba(255,255,255,0.4); font-size:13px; line-height:1.5; margin:32px 0 0 0;">
                                    If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top:32px; border-top:1px solid rgba(255,255,255,0.08); margin-top:32px;">
                                <p style="color:rgba(255,255,255,0.3); font-size:11px; text-align:center; margin:0;">
                                    © 2026 NutriAI · Intelligent Personalized Nutrition
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    success = send_via_gmail_api(to_email, subject, html_content)
    if not success:
        # Fallback print to terminal so local development still works without blocking
        print("\n" + "="*60)
        print(f"  [DEVELOPMENT OTP FALLBACK - GMAIL API NOT INITIALIZED]")
        print(f"  Email: {to_email}")
        print(f"  Verification Code: {otp_code}")
        print("="*60 + "\n")
    return success

def send_password_reset_email(to_email, reset_link, user_name="there"):
    """Send password reset email via Google Gmail API."""
    subject = "🔑 NutriAI — Reset Your Password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#0a1128; font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a1128; padding:40px 20px;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(26,26,46,0.95),rgba(10,17,40,0.95)); border:1px solid rgba(168,85,247,0.2); border-radius:24px; padding:48px 40px;">
                        <tr>
                            <td align="center" style="padding-bottom:32px;">
                                <div style="font-size:32px; font-weight:800; background:linear-gradient(135deg,#2dd4bf,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-0.5px;">
                                    NutriAI
                                </div>
                                <div style="color:rgba(255,255,255,0.5); font-size:12px; letter-spacing:2px; margin-top:4px;">
                                    INTELLIGENT NUTRITION
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <h2 style="color:#ffffff; font-size:22px; margin:0 0 8px 0; font-weight:600;">
                                    Reset Your Password 🔑
                                </h2>
                                <p style="color:rgba(255,255,255,0.6); font-size:15px; line-height:1.6; margin:0 0 32px 0;">
                                    Hey {user_name}, click the button below to securely reset your password. This link will expire in <strong>1 hour</strong>.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding:12px 0 28px 0;">
                                <a href="{reset_link}" style="display:inline-block; background:linear-gradient(135deg,#a855f7,#6d28d9); color:#ffffff; text-decoration:none; font-size:15px; font-weight:600; padding:14px 48px; border-radius:50px; letter-spacing:0.5px;">
                                    Reset Password
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="color:rgba(255,255,255,0.4); font-size:13px; line-height:1.5; margin:0;">
                                    If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-top:32px; border-top:1px solid rgba(255,255,255,0.08); margin-top:32px;">
                                <p style="color:rgba(255,255,255,0.3); font-size:11px; text-align:center; margin:0;">
                                    © 2026 NutriAI · Intelligent Personalized Nutrition
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    success = send_via_gmail_api(to_email, subject, html_content)
    if not success:
        print(f"[DEVELOPMENT RESET FALLBACK] Reset link for {to_email}: {reset_link}")
    return success
