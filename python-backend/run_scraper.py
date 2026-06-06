import sys
import os
import json
import sqlite3
import asyncio
from telethon import TelegramClient
from telethon_auth import API_ID, API_HASH
from scraper import JobScraper
from youtube_scraper import YouTubeScraper

async def main():
    try:
        must_have = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else []
        exclude = sys.argv[2].split(',') if len(sys.argv) > 2 and sys.argv[2] else []
        max_messages = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else 200
        start_date = sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] else None
        end_date = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else None
        experience_levels = sys.argv[6].split(',') if len(sys.argv) > 6 and sys.argv[6] else []
        youtube_urls = sys.argv[7].split(',') if len(sys.argv) > 7 and sys.argv[7] else []
        scrape_telegram = sys.argv[8].lower() == 'true' if len(sys.argv) > 8 else True
        min_salary = float(sys.argv[9]) if len(sys.argv) > 9 and sys.argv[9] else None
        max_salary = float(sys.argv[10]) if len(sys.argv) > 10 and sys.argv[10] else None

        must_have = [k.strip() for k in must_have if k.strip()]
        exclude = [k.strip() for k in exclude if k.strip()]
        experience_levels = [l.strip() for l in experience_levels if l.strip()]
        youtube_urls = [u.strip() for u in youtube_urls if u.strip()]

        total_jobs = 0
        all_results = {}

        if youtube_urls:
            print(json.dumps({"type": "status", "message": f"Target YouTube channels to scrape: {', '.join(youtube_urls)}"}))
            sys.stdout.flush()

            db_path = 'flux.db'
            yt_scraper = YouTubeScraper(db_path=db_path)
            yt_scraper.is_running = True

            def on_yt_progress(data):
                print(json.dumps({
                    "type": "progress",
                    "channel": data['channel'],
                    "jobs": data['jobs'],
                    "total": data['total'],
                    "progress": data['progress']
                }))
                sys.stdout.flush()

            yt_result = await yt_scraper.scrape_multiple_channels(
                channels=youtube_urls,
                max_messages=max_messages,
                start_date=start_date,
                end_date=end_date,
                on_progress=on_yt_progress
            )
            total_jobs += yt_result.get('total_jobs', 0)
            all_results.update(yt_result.get('channels', {}))

        if scrape_telegram:
            print(json.dumps({"type": "status", "message": "Connecting to Telegram..."}))
            sys.stdout.flush()

            client = TelegramClient('flux_session', API_ID, API_HASH)
            await client.connect()
            if not await client.is_user_authorized():
                print(json.dumps({"type": "error", "message": "Client is not authorized. Please log in first."}))
                sys.stdout.flush()
                await client.disconnect()
                return

            print(json.dumps({"type": "status", "message": "Authenticated. Fetching active channels..."}))
            sys.stdout.flush()

            db_path = 'flux.db'
            scraper = JobScraper(client, db_path=db_path)

            conn = sqlite3.connect(db_path, timeout=10)
            cursor = conn.cursor()
            cursor.execute("SELECT channel_username FROM channels WHERE enabled = 1")
            rows = cursor.fetchall()
            channels = [r[0] for r in rows]
            conn.close()

            if not channels:
                channels = ['LMTPlacements', 'algoprep_in', 'jobs_off_campus', 'jobs4fresherdotcom', 'jobsinternshipshub', 'offcampusjobs_4u', 'dot_aware']

            print(json.dumps({"type": "status", "message": f"Target channels to scrape: {', '.join(channels)}"}))
            sys.stdout.flush()

            def on_progress(data):
                print(json.dumps({
                    "type": "progress",
                    "channel": data['channel'],
                    "jobs": data['jobs'],
                    "total": data['total'] + total_jobs,
                    "progress": data['progress']
                }))
                sys.stdout.flush()

            scraper.is_running = True
            result = await scraper.scrape_multiple_channels(
                channels=channels,
                max_messages=max_messages,
                must_include_keywords=must_have,
                exclude_keywords=exclude,
                start_date=start_date,
                end_date=end_date,
                experience_levels=experience_levels,
                min_salary=min_salary,
                max_salary=max_salary,
                on_progress=on_progress
            )
            await client.disconnect()
            
            total_jobs += result.get('total_jobs', 0)
            all_results.update(result.get('channels', {}))
            
        final_result = {
            'total_jobs': total_jobs,
            'channels': all_results
        }
        
        print(json.dumps({"type": "success", "result": final_result}))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}))
        sys.stdout.flush()

if __name__ == '__main__':
    asyncio.run(main())
