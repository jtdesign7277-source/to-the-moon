"""
Shared encryption utilities for TO THE MOON.
Single source of truth for credential encryption/decryption.
"""
import os
import hashlib
import base64
from cryptography.fernet import Fernet

# Get encryption key from environment
# Falls back to SECRET_KEY (which is already set on Railway) to ensure persistence
CREDENTIALS_ENCRYPTION_KEY = os.environ.get('CREDENTIALS_ENCRYPTION_KEY')

if not CREDENTIALS_ENCRYPTION_KEY:
    # Use SECRET_KEY as fallback - this is already set on Railway
    secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    # Derive a valid Fernet key from SECRET_KEY using SHA256
    key_bytes = hashlib.sha256(secret_key.encode()).digest()
    CREDENTIALS_ENCRYPTION_KEY = base64.urlsafe_b64encode(key_bytes)
else:
    CREDENTIALS_ENCRYPTION_KEY = CREDENTIALS_ENCRYPTION_KEY.encode() if isinstance(CREDENTIALS_ENCRYPTION_KEY, str) else CREDENTIALS_ENCRYPTION_KEY

# Single fernet instance for the entire app
fernet = Fernet(CREDENTIALS_ENCRYPTION_KEY)


def encrypt_credential(value: str) -> str:
    """Encrypt a credential value."""
    if not value:
        return None
    return fernet.encrypt(value.encode()).decode()


def decrypt_credential(encrypted_value: str) -> str:
    """Decrypt a credential value."""
    if not encrypted_value:
        return None
    try:
        return fernet.decrypt(encrypted_value.encode()).decode()
    except Exception:
        return None
