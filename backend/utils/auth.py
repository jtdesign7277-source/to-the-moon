"""
Authentication utilities for TO THE MOON.
"""
import os
import jwt
import bcrypt
from functools import wraps
from flask import request, jsonify, g
from models import User, Subscription

# JWT Configuration - must match api_server.py
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
JWT_ALGORITHM = 'HS256'


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def decode_jwt_token(token):
    """Decode and validate a JWT token. Returns user_id or None."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def jwt_required_custom(fn):
    """Custom JWT decorator that loads user into g.current_user."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401

        token = auth_header[7:]  # Remove 'Bearer ' prefix

        if not token:
            return jsonify({'error': 'Missing token'}), 401

        user_id = decode_jwt_token(token)

        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401

        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 401

        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def pro_required(fn):
    """Decorator that requires Pro subscription."""
    @wraps(fn)
    @jwt_required_custom
    def wrapper(*args, **kwargs):
        subscription = Subscription.query.filter_by(user_id=g.current_user.id).first()

        if not subscription or not subscription.is_pro:
            return jsonify({
                'error': 'Pro subscription required',
                'code': 'PRO_REQUIRED',
            }), 403

        return fn(*args, **kwargs)

    return wrapper


def validate_email(email: str) -> bool:
    """Basic email validation."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength.
    Returns (is_valid, error_message).
    """
    if len(password) < 8:
        return False, 'Password must be at least 8 characters'

    if not any(c.isupper() for c in password):
        return False, 'Password must contain at least one uppercase letter'

    if not any(c.islower() for c in password):
        return False, 'Password must contain at least one lowercase letter'

    if not any(c.isdigit() for c in password):
        return False, 'Password must contain at least one number'

    return True, ''


def validate_username(username: str) -> tuple[bool, str]:
    """
    Validate username format.
    Returns (is_valid, error_message).
    """
    import re

    if len(username) < 3:
        return False, 'Username must be at least 3 characters'

    if len(username) > 20:
        return False, 'Username must be at most 20 characters'

    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return False, 'Username can only contain letters, numbers, and underscores'

    return True, ''
