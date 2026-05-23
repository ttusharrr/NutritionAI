"""Email service using Gmail SMTP for OTP and password reset emails."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config


def send_otp_email(to_email, otp_code, user_name="there"):
    """Send OTP verification email via Gmail SMTP."""
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

    # Network Diagnostic Check
    import socket
    print(f"\n--- [DIAGNOSTIC] Testing connection to {Config.SMTP_SERVER} ---")
    try:
        # 1. Test DNS Resolution
        resolved_ips = socket.getaddrinfo(Config.SMTP_SERVER, 465)
        ip_list = list(set([x[4][0] for x in resolved_ips]))
        print(f"[DIAGNOSTIC] DNS Resolution Successful: {ip_list}")
        
        # 2. Test TCP Port Connection directly (timeout 5s)
        for ip in ip_list:
            # Skip IPv6 if the platform doesn't support it
            if ":" in ip:
                continue
            try:
                print(f"[DIAGNOSTIC] Testing TCP connection to IPv4 {ip}:465...")
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(5)
                s.connect((ip, 465))
                s.close()
                print(f"[DIAGNOSTIC] TCP Port 465 is OPEN to {ip}!")
            except Exception as conn_err:
                print(f"[DIAGNOSTIC] TCP Connection to {ip}:465 failed: {conn_err}")
    except Exception as dns_err:
        print(f"[DIAGNOSTIC ERROR] DNS Resolution failed: {dns_err}")
    print("---------------------------------------------------\n")

    try:
        msg = MIMEMultipart()
        msg['From'] = f"NutriAI <{Config.SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        # Try Port 465 (SSL) first
        try:
            print("[EMAIL] Attempting delivery on Port 465 (SSL)...")
            with smtplib.SMTP_SSL(Config.SMTP_SERVER, 465, timeout=10) as server:
                server.login(Config.SENDER_EMAIL, Config.EMAIL_PASSWORD)
                server.send_message(msg)
            print(f"[EMAIL] OTP sent to {to_email} via Port 465 (SSL)")
            return True
        except Exception as ssl_err:
            print(f"[EMAIL WARNING] Port 465 (SSL) failed: {ssl_err}. Trying Port 587 (TLS)...")
            
            # Fallback to Port 587 (TLS/STARTTLS)
            try:
                with smtplib.SMTP(Config.SMTP_SERVER, 587, timeout=10) as server:
                    server.starttls()
                    server.login(Config.SENDER_EMAIL, Config.EMAIL_PASSWORD)
                    server.send_message(msg)
                print(f"[EMAIL] OTP sent to {to_email} via Port 587 (TLS)")
                return True
            except Exception as tls_err:
                print(f"[EMAIL ERROR] Both Port 465 and Port 587 failed.")
                print(f"  Port 465 Error: {ssl_err}")
                print(f"  Port 587 Error: {tls_err}")
                raise tls_err
                
    except Exception as e:
        print(f"\n[EMAIL ERROR] ❌ Failed to send OTP to {to_email}: {str(e)}")
        print("\n" + "="*60)
        print(f"  [DEVELOPMENT OTP FALLBACK]")
        print(f"  Email: {to_email}")
        print(f"  Verification Code: {otp_code}")
        print("="*60 + "\n")
        return False


def send_password_reset_email(to_email, reset_link, user_name="there"):
    """Send password reset email via Gmail SMTP."""
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
                                <div style="font-size:32px; font-weight:800; background:linear-gradient(135deg,#2dd4bf,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
                                    NutriAI
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <h2 style="color:#ffffff; font-size:22px; margin:0 0 8px 0;">
                                    Reset Your Password
                                </h2>
                                <p style="color:rgba(255,255,255,0.6); font-size:15px; line-height:1.6; margin:0 0 32px 0;">
                                    Hey {user_name}, we received a request to reset your password. Click the button below to create a new one. This link expires in <strong style="color:#a855f7;">1 hour</strong>.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding:16px 0 32px 0;">
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

    try:
        msg = MIMEMultipart()
        msg['From'] = f"NutriAI <{Config.SENDER_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))

        # Try Port 465 (SSL) first
        try:
            print("[EMAIL] Attempting delivery on Port 465 (SSL)...")
            with smtplib.SMTP_SSL(Config.SMTP_SERVER, 465, timeout=10) as server:
                server.login(Config.SENDER_EMAIL, Config.EMAIL_PASSWORD)
                server.send_message(msg)
            print(f"[EMAIL] Reset link sent to {to_email} via Port 465 (SSL)")
            return True
        except Exception as ssl_err:
            print(f"[EMAIL WARNING] Port 465 (SSL) failed: {ssl_err}. Trying Port 587 (TLS)...")
            
            # Fallback to Port 587 (TLS/STARTTLS)
            try:
                with smtplib.SMTP(Config.SMTP_SERVER, 587, timeout=10) as server:
                    server.starttls()
                    server.login(Config.SENDER_EMAIL, Config.EMAIL_PASSWORD)
                    server.send_message(msg)
                print(f"[EMAIL] Reset link sent to {to_email} via Port 587 (TLS)")
                return True
            except Exception as tls_err:
                print(f"[EMAIL ERROR] Both Port 465 and Port 587 failed.")
                print(f"  Port 465 Error: {ssl_err}")
                print(f"  Port 587 Error: {tls_err}")
                raise tls_err
                
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send reset email to {to_email}: {str(e)}")
        print(f"[FALLBACK] Reset link for {to_email}: {reset_link}")
        return False
