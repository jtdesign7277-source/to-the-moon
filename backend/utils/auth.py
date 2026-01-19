"""
Authentication utilities for TO THE MOON.
"""
import bcrypt
from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User, Subscription


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def jwt_required_custom(fn):
    """Custom JWT decorator that loads user into g.current_user."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if not user:
                return jsonify({'error': 'User not found'}), 401

            g.current_user = user
            return fn(*args, **kwargs)

        except Exception as e:
            return jsonify({'error': 'Invalid or expired token'}), 401

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
