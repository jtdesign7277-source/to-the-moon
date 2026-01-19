"""
Authentication routes for TO THE MOON.
"""
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
