"""
Shared encryption utilities for TO THE MOON.
Single source of truth for credential encryption/decryption.
"""
import os
from cryptography.fernet import Fernet

# Get encryption key from environment or generate one
CREDENTIALS_ENCRYPTION_KEY = os.environ.get('CREDENTIALS_ENCRYPTION_KEY')

if not CREDENTIALS_ENCRYPTION_KEY:
    # Generate a fallback key if not set (not recommended for production)
    CREDENTIALS_ENCRYPTION_KEY = Fernet.generate_key()
    print("[WARNING] CREDENTIALS_ENCRYPTION_KEY not set. Using generated key.")
    print("[WARNING] Set this env var in production to persist encrypted credentials across deploys!")
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
