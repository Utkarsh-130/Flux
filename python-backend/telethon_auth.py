import os
import json
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_ID = int(os.getenv('TELEGRAM_API_ID') or os.getenv('API_ID') or '29639195')
API_HASH = os.getenv('TELEGRAM_API_HASH') or os.getenv('API_HASH') or '0b6b47efcc5668bf021bb95628055fbf'

class TelegramAuth:
    """Manages Telegram authentication via Telethon (phone/OTP/2FA)"""

    def __init__(self, session_name='flux_session'):
        self.session_name = session_name
        self.client = None

    async def request_code(self, phone_number: str) -> str:
  
        try:
            self.client = TelegramClient(self.session_name, API_ID, API_HASH)
            await self.client.connect()
            result = await self.client.send_code_request(phone_number)
            return result.phone_code_hash
        except Exception as e:
            print(f"Error requesting code: {e}")
            raise e

    async def verify_code(self, phone_number: str, phone_code: str, 
                         phone_code_hash: str, password: str = None) -> bool:
        
        try:
            if not self.client:
                self.client = TelegramClient(self.session_name, API_ID, API_HASH)
            await self.client.connect()
            await self.client.sign_in(phone_number, phone_code, phone_code_hash=phone_code_hash)
        except SessionPasswordNeededError:
            if password:
                await self.client.sign_in(password=password)
            else:
                print("2FA password required but not provided")
                return False
        except Exception as e:
            print(f"Error verifying code: {e}")
            raise e
        return True

    async def is_authenticated(self) -> bool:
     
        if not self.client:
            self.client = TelegramClient(self.session_name, API_ID, API_HASH)
        try:
            await self.client.connect()
            return await self.client.is_user_authorized()
        except Exception:
            return False

    async def get_me(self) -> dict:
        """Gets profile info for the currently authenticated user"""
        if not self.client:
            self.client = TelegramClient(self.session_name, API_ID, API_HASH)
        try:
            await self.client.connect()
            if not await self.client.is_user_authorized():
                return None
            me = await self.client.get_me()
            return {
                'id': me.id,
                'first_name': me.first_name,
                'last_name': me.last_name,
                'username': me.username,
                'phone': me.phone,
            }
        except Exception as e:
            print(f"Error getting user info: {e}")
            return None

    async def disconnect(self):
        if self.client:
            await self.client.disconnect()
