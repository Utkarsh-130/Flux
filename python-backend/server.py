#!/usr/bin/env python3

import os
import sys
from scraper import ScraperServer

if __name__ == '__main__':
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN', '')
    
    if not bot_token:
        try:
            import json
            config_path = os.path.expanduser('~/.flux/config.json')
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    bot_token = config.get('telegram_bot_token', '')
        except:
            pass
    
    if not bot_token:
        print("[Error] TELEGRAM_BOT_TOKEN environment variable not set", file=sys.stderr)
        sys.exit(1)
    
    server = ScraperServer(bot_token)
    server.start()
