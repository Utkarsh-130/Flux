import sys
import json
import asyncio
from telethon import TelegramClient
from telethon_auth import TelegramAuth, API_ID, API_HASH

async def main():
    try:
        phone = sys.argv[1]
        otp = sys.argv[2]
        phone_code_hash = sys.argv[3]
        auth = TelegramAuth(session_name='flux_session')
        auth.client = TelegramClient(auth.session_name, API_ID, API_HASH)
        await auth.client.connect()
        success = await auth.verify_code(phone, otp, phone_code_hash)
        await auth.disconnect()
        if success:
            print(json.dumps({"success": True}))
        else:
            print(json.dumps({"success": False, "error": "Verification failed"}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == '__main__':
    asyncio.run(main())
