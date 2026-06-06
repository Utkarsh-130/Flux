import re
import sqlite3
import asyncio
from datetime import datetime
from typing import List, Dict
import yt_dlp

class YouTubeScraper:
    def __init__(self, db_path: str = 'flux.db'):
        self.db_path = db_path
        self.is_running = False
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute('PRAGMA journal_mode=WAL')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS youtube_links (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    channel_name TEXT,
                    video_title TEXT,
                    video_url TEXT,
                    link_url TEXT,
                    context TEXT,
                    date_added TEXT
                )
            ''')
            conn.commit()
        finally:
            conn.close()

    async def scrape_channel(
        self,
        channel_url: str,
        max_messages: int = 20,
        must_include_keywords: List[str] = None,
        exclude_keywords: List[str] = None,
        start_date: str = None,
        end_date: str = None,
    ) -> int:
        """Scrapes video descriptions from a YouTube channel for links"""
        start_dt = None
        end_dt = None
        if start_date:
            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            except Exception:
                pass
        if end_date:
            try:
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
            except Exception:
                pass

        links_found = 0
        links_parsed_list = []
        
        
        url_regex = re.compile(r'https?://[^\s()<>]+(?:\([\w\d]+\)|[^\s`!()\[\]{};:\'".,<>?«»“”‘’])')

        ydl_opts = {
            'extract_flat': False,
            'quiet': True,
            'no_warnings': True,
            'playlist_items': f'1-{max_messages}',
            'extract_flat': 'in_playlist',
            'ignoreerrors': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(channel_url, download=False)
                if not info:
                    print(f"Could not extract info from {channel_url}")
                    return 0

                channel_name = info.get('uploader') or info.get('title') or channel_url
                
                def get_videos(entry_data):
                    vids = []
                    if not entry_data:
                        return vids
                    if entry_data.get('_type') == 'playlist' or 'entries' in entry_data:
                        for sub in entry_data.get('entries', []):
                            vids.extend(get_videos(sub))
                    else:
                        vids.append(entry_data)
                    return vids

                entries = get_videos(info)
                entries = entries[:max_messages]

                for idx, entry in enumerate(entries):
                    if not entry:
                        continue
                        
                    if entry.get('description') is not None:
                        video_info = entry
                    else:
                        vid_url = entry.get('url') or entry.get('webpage_url')
                        if not vid_url:
                            continue
                        try:
                            video_info = ydl.extract_info(vid_url, download=False)
                        except Exception as e:
                            continue

                    if not video_info:
                        continue

                    description = video_info.get('description', '')
                    if not description:
                        continue
                    
                    upload_date_str = video_info.get('upload_date')
                    msg_date = None
                    if upload_date_str and len(upload_date_str) == 8:
                        try:
                            msg_date = datetime.strptime(upload_date_str, "%Y%m%d").date()
                        except Exception:
                            pass

                    if msg_date:
                        if start_dt and msg_date < start_dt:
                            continue
                        if end_dt and msg_date > end_dt:
                            continue

                    lines = description.split('\n')
                    for line in lines:
                        found_urls = url_regex.findall(line)
                        for url in found_urls:
                            links_parsed_list.append({
                                'channel_name': channel_name,
                                'video_title': video_info.get('title', 'Unknown Title'),
                                'video_url': video_info.get('webpage_url', ''),
                                'link_url': url.strip(),
                                'context': line.strip()[:200], # store up to 200 chars as context
                                'date_added': datetime.now().isoformat()
                            })

            if links_parsed_list:
                conn = sqlite3.connect(self.db_path, timeout=10)
                try:
                    conn.execute('PRAGMA journal_mode=WAL')
                    cursor = conn.cursor()
                    for item in links_parsed_list:
                        try:
                            cursor.execute('''
                                INSERT INTO youtube_links (
                                    channel_name, video_title, video_url, link_url, context, date_added
                                ) VALUES (?, ?, ?, ?, ?, ?)
                            ''', (
                                item['channel_name'],
                                item['video_title'],
                                item['video_url'],
                                item['link_url'],
                                item['context'],
                                item['date_added']
                            ))
                            links_found += 1
                        except Exception as e:
                            print(f"Error saving YT link: {e}")
                    conn.commit()
                finally:
                    conn.close()

            return links_found

        except Exception as e:
            print(f"Error scraping YouTube channel {channel_url}: {e}")
            return 0

    async def scrape_multiple_channels(
        self,
        channels: List[str],
        max_messages: int = 20,
        start_date: str = None,
        end_date: str = None,
        on_progress=None
    ) -> Dict:
        total_links = 0
        results = {}


        for i, channel in enumerate(channels):
            if not self.is_running:
                break

            links_cnt = await self.scrape_channel(
                channel,
                max_messages=max_messages,
                start_date=start_date,
                end_date=end_date
            )
            
            results[channel] = links_cnt
            total_links += links_cnt

            if on_progress:
                progress = ((i + 1) / len(channels)) * 100
                on_progress({
                    'channel': channel,
                    'jobs': links_cnt,
                    'total': total_links,
                    'progress': progress,
                })

        return {
            'total_jobs': total_links, 
            'channels': results,
            'timestamp': datetime.now().isoformat(),
        }
