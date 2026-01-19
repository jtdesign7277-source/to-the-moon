"""
Authentication routes for TO THE MOON.
"""
import os
import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from models import db, User, Subscription
from utils.auth import (
    hash_password,
    verify_password,
    validate_email,
    validate_password,
    validate_username,
    jwt_required_custom,
)

auth_bp = Blueprint('auth', __name__)

# In-memory store for password reset tokens (in production, use Redis or database)
password_reset_tokens = {}


def send_reset_email(email, reset_token, reset_url):
    """Send password reset email using Resend."""
    resend_api_key = os.environ.get('RESEND_API_KEY')
    
    if not resend_api_key:
        print(f"[DEV MODE] Password reset link for {email}: {reset_url}")
        return True
    
    try:
        import requests
        
        response = requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {resend_api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': 'ToTheMoon <noreply@tothemoon.app>',
                'to': [email],
                'subject': 'Reset Your Password - ToTheMoon',
                'html': f'''
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4F46E5;">Reset Your Password</h2>
                        <p>You requested to reset your password for your ToTheMoon account.</p>
                        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
                        <a href="{reset_url}" 
                           style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); 
                                  color: white; padding: 12px 24px; text-decoration: none; 
                                  border-radius: 8px; font-weight: bold; margin: 20px 0;">
                            Reset Password
                        </a>
                        <p style="color: #666; font-size: 14px;">
                            If you didn't request this, you can safely ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">
                            ToTheMoon - Prediction Market Trading Bot
                        </p>
                    </div>
                ''',
            }
        )
        
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to send reset email: {e}")
        return False


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset email."""
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email or not validate_email(email):
            return jsonify({'error': 'Valid email address required'}), 400
        
        # Find user (don't reveal if email exists)
        user = User.query.filter_by(email=email).first()
        
        # Always return success to prevent email enumeration
        if not user:
            return jsonify({
                'message': 'If an account exists with that email, you will receive a password reset link.',
            }), 200
        
        # Generate secure token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        # Store token (in production, store in database)
        password_reset_tokens[reset_token] = {
            'user_id': user.id,
            'email': email,
            'expires_at': expires_at,
        }
        
        # Build reset URL
        frontend_url = os.environ.get('FRONTEND_URL', 'https://to-the-moon-three.vercel.app')
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        # Send email
        send_reset_email(email, reset_token, reset_url)
        
        return jsonify({
            'message': 'If an account exists with that email, you will receive a password reset link.',
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to process request: {str(e)}'}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token."""
    try:
        data = request.get_json()
        token = data.get('token', '')
        new_password = data.get('password', '')
        
        if not token:
            return jsonify({'error': 'Reset token required'}), 400
        
        if not new_password:
            return jsonify({'error': 'New password required'}), 400
        
        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Find and validate token
        token_data = password_reset_tokens.get(token)
        
        if not token_data:
            return jsonify({'error': 'Invalid or expired reset link'}), 400
        
        if datetime.utcnow() > token_data['expires_at']:
            # Clean up expired token
            del password_reset_tokens[token]
            return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400
        
        # Find user
        user = User.query.get(token_data['user_id'])
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update password
        user.password_hash = hash_password(new_password)
        db.session.commit()
        
        # Remove used token
        del password_reset_tokens[token]
        
        return jsonify({
            'message': 'Password reset successfully. You can now log in with your new password.',
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to reset password: {str(e)}'}), 500


@auth_bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify if a reset token is valid."""
    try:
        data = request.get_json()
        token = data.get('token', '')
        
        if not token:
            return jsonify({'valid': False, 'error': 'Token required'}), 400
        
        token_data = password_reset_tokens.get(token)
        
        if not token_data:
            return jsonify({'valid': False, 'error': 'Invalid reset link'}), 400
        
        if datetime.utcnow() > token_data['expires_at']:
            del password_reset_tokens[token]
            return jsonify({'valid': False, 'error': 'Reset link has expired'}), 400
        
        return jsonify({
            'valid': True,
            'email': token_data['email'],
        }), 200
        
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user account."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        username = data.get('username', '').strip()

        # Validate email
        if not email or not validate_email(email):
            return jsonify({'error': 'Valid email address required'}), 400

        # Validate password
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Validate username
        is_valid, error_msg = validate_username(username)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Check if email exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409

        # Check if username exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already taken'}), 409

        # Create user
        user = User(
            email=email,
            password_hash=hash_password(password),
            username=username,
        )
        db.session.add(user)
        db.session.flush()  # Get user ID

        # Create free subscription
        subscription = Subscription(
            user_id=user.id,
            tier='free',
            status='active',
        )
        db.session.add(subscription)
        db.session.commit()

        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'message': 'Account created successfully',
            'user': user.to_dict(),
            'subscription': subscription.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token,
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({'error': 'Email and password required'}), 400

        # Find user
        user = User.query.filter_by(email=email).first()

        if not user or not verify_password(password, user.password_hash):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Get subscription
        subscription = Subscription.query.filter_by(user_id=user.id).first()

        # Generate tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'subscription': subscription.to_dict() if subscription else {'tier': 'free'},
            'access_token': access_token,
            'refresh_token': refresh_token,
        }), 200

    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required_custom
def refresh():
    """Refresh access token."""
    try:
        user_id = get_jwt_identity()
        access_token = create_access_token(identity=user_id)

        return jsonify({
            'access_token': access_token,
        }), 200

    except Exception as e:
        return jsonify({'error': f'Token refresh failed: {str(e)}'}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required_custom
def get_current_user():
    """Get current authenticated user."""
    try:
        user = g.current_user
        subscription = Subscription.query.filter_by(user_id=user.id).first()

        return jsonify({
            'user': user.to_dict(),
            'subscription': subscription.to_dict() if subscription else {'tier': 'free'},
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to get user: {str(e)}'}), 500


@auth_bp.route('/update-password', methods=['POST'])
@jwt_required_custom
def update_password():
    """Update user password."""
    try:
        data = request.get_json()
        user = g.current_user

        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')

        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords required'}), 400

        # Verify current password
        if not verify_password(current_password, user.password_hash):
            return jsonify({'error': 'Current password is incorrect'}), 401

        # Validate new password
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({'error': error_msg}), 400

        # Update password
        user.password_hash = hash_password(new_password)
        db.session.commit()

        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Password update failed: {str(e)}'}), 500
