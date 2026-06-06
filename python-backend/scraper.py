import re
import asyncio
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
from telethon import TelegramClient
from telethon.tl.types import Channel
import os
from dotenv import load_dotenv

load_dotenv()

class JobScraper:
    """Core job scraper that extracts job postings from Telegram channels"""

    def __init__(self, client: TelegramClient, db_path: str = 'flux.db'):
        self.client = client
        self.db_path = db_path
        self.is_running = False
        self.job_count = 0
        self.setup_database()

    def setup_database(self):
        """Creates the sqlite database schema if not present"""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.execute('PRAGMA journal_mode=WAL')
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT,
                location TEXT,
                salary_min REAL,
                salary_max REAL,
                salary_currency TEXT,
                job_type TEXT,
                experience_years TEXT,
                deadline TEXT,
                apply_link TEXT,
                channel_name TEXT,
                message_id INTEGER,
                raw_text TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_username TEXT UNIQUE NOT NULL,
                channel_name TEXT,
                enabled BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()

    def parse_job_message(self, text: str) -> Optional[List[Dict]]:
        if not text:
            return None

        def clean_and_fallback(jobs: List[Dict]) -> List[Dict]:
            if not jobs:
                return jobs
            for job in jobs:
                for key in ['title', 'company', 'location', 'experience_years', 'deadline']:
                    if key in job and isinstance(job[key], str):
                        job[key] = job[key].replace('**', '').replace('*', '').strip()
                if not job.get('company') or job.get('company') == 'N/A':
                    first_line = text.split('\n')[0]
                    hiring_i = re.search(r'(?:Hiring\s*[Ii]\s*|Hiring\s*\|\s*)([A-Za-z0-9\s\-\.]+?)(?:\s+Off|\s+Of|\s+Drive|\s+fresher|\s+Recruitment|\s+Mega|$)', first_line)
                    if hiring_i:
                        job['company'] = hiring_i.group(1).strip()
                    else:
                        m = re.search(r'^([A-Za-z0-9\s\-\.]+?)\s+(?:MASS\s+Hiring|Hiring|Off\s+Campus|Recruitment|Drive)\b', first_line, re.IGNORECASE)
                        if m:
                            job['company'] = m.group(1).strip()
                        else:
                            job['company'] = 'N/A'
                if not job.get('title'):
                    job['title'] = 'Job Opening'
            return jobs

        global_exp = 'N/A'
        exp_m = re.search(r'(?:experience|years|exp)\s*:\s*([^\n🎓💼📍🔔🚀💰]+)', text, re.IGNORECASE)
        if exp_m:
            global_exp = exp_m.group(1).strip()

        if '📌' in text:
            parsed = []
            lines = text.split('\n')
            for line in lines:
                if '📌' in line:
                    match = re.search(r'📌\s*(.+?)\s+(?:is\s+hiring|hiring)\s+(.+?)(?:\s+Batch:|\s+Location:|\s+Apply|\*|$)', line, re.IGNORECASE)
                    if match:
                        company = match.group(1).strip()
                        title = match.group(2).strip()
                        title = re.split(r'(?:\s+Batch:|\s+Location:|\s+Apply|\s+here:)', title, flags=re.IGNORECASE)[0].strip()
                        loc_match = re.search(r'Location\s*:\s*([^📌\n*]+?)(?:\s+Apply|\s+here:|\s*http|\s*\*|$)', line, re.IGNORECASE)
                        location = loc_match.group(1).strip() if loc_match else 'N/A'
                        links = re.findall(r'(https?://[^\s\n]+)', line)
                        if not links:
                            links = re.findall(r'(https?://[^\s\n]+)', text)
                        apply_link = ''
                        for link in links:
                            if 'whatsapp.com' not in link and 't.me' not in link and 'telegram.org' not in link:
                                apply_link = link.strip('*').strip()
                                break
                        parsed.append({
                            'title': title,
                            'company': company,
                            'location': location,
                            'apply_link': apply_link,
                            'experience_years': global_exp,
                            'deadline': 'N/A'
                        })
            if parsed:
                return clean_and_fallback(parsed)

        bell_rocket_match = re.search(r'(?:🔔|🚀)\s*([^\n|]+?)\s+(?:Hiring|Recruitment Drive|Recruitment|Drive)\b', text, re.IGNORECASE)
        if bell_rocket_match:
            company = bell_rocket_match.group(1).strip()
            role_match = re.search(r'(?:job\s*role|roles|role|designation|position)\s*:\s*([^\n🎓📍💰💼]+)', text, re.IGNORECASE)
            title = role_match.group(1).strip() if role_match else 'Job Opening'
            loc_match = re.search(r'(?:job\s*location|location|city|place|work\s+mode)\s*:\s*([^\n🎓💼💰🔔🚀]+)', text, re.IGNORECASE)
            location = loc_match.group(1).strip() if loc_match else 'N/A'
            sal_match = re.search(r'(?:salary|package|ctc|pay|stipend)\s*:\s*([^\n🎓💼📍🔔🚀]+)', text, re.IGNORECASE)
            salary_min, salary_max, salary_currency = None, None, 'INR'
            if sal_match:
                sal_str = sal_match.group(1).replace('₹', '').replace('Rs.', '').replace('Rs', '').replace(',', '').strip()
                if re.search(r'\b(unpaid|no stipend)\b', sal_str, re.IGNORECASE):
                    salary_min, salary_max, salary_currency = 0, 0, 'UNPAID'
                else:
                    range_match = re.search(r'([\d.,]+)\s*(?:-|–|to)\s*([\d.,]+)\s*(lpa|lakhs|k|usd|inr|\$)?', sal_str, re.IGNORECASE)
                    if range_match:
                        try:
                            salary_min = float(range_match.group(1).replace(',', ''))
                            salary_max = float(range_match.group(2).replace(',', ''))
                            salary_currency = range_match.group(3).strip().upper() if range_match.group(3) else 'LPA'
                        except:
                            pass
                    else:
                        single_match = re.search(r'([\d.,]+)\s*(lpa|lakhs|k|usd|inr|\$)?', sal_str, re.IGNORECASE)
                        if single_match:
                            try:
                                salary_min = float(single_match.group(1).replace(',', ''))
                                job_data_max = float(single_match.group(1).replace(',', ''))
                                salary_max = job_data_max
                                salary_currency = single_match.group(2).strip().upper() if single_match.group(2) else 'LPA'
                            except:
                                pass
            exp_match = re.search(r'(?:experience|years|exp)\s*:\s*([^\n🎓💼📍🔔🚀💰]+)', text, re.IGNORECASE)
            experience_years = exp_match.group(1).strip() if exp_match else 'N/A'
            links = re.findall(r'(https?://[^\s\n]+)', text)
            apply_link = ''
            for link in links:
                if 'whatsapp.com' not in link and 't.me' not in link and 'telegram.org' not in link:
                    apply_link = link.strip('*').strip()
                    break
            return clean_and_fallback([{
                'title': title,
                'company': company,
                'location': location,
                'apply_link': apply_link,
                'experience_years': experience_years,
                'deadline': 'N/A',
                'salary_min': salary_min,
                'salary_max': salary_max,
                'salary_currency': salary_currency
            }])

        blocks = []
        block_matches = list(re.finditer(r'(?:\b\d+[\.\)\s]*Company\s*:\s*)', text, re.IGNORECASE))
        if len(block_matches) > 1:
            for i in range(len(block_matches)):
                start = block_matches[i].start()
                end = block_matches[i+1].start() if i + 1 < len(block_matches) else len(text)
                blocks.append(text[start:end])
        elif re.search(r'Company\s*:\s*[^\n]+', text, re.IGNORECASE) and len(re.findall(r'(?:https?://[^\s\n]+)', text)) > 2:
            company_match = re.search(r'Company\s*:\s*([^\n]+)', text, re.IGNORECASE)
            company = company_match.group(1).strip() if company_match else 'N/A'
            location_match = re.search(r'(?:Work\s+Mode|Location)\s*:\s*([^\n]+)', text, re.IGNORECASE)
            location = location_match.group(1).strip() if location_match else 'N/A'
            pay_match = re.search(r'(?:Pay|Salary|CTC)\s*:\s*([^\n]+)', text, re.IGNORECASE)
            pay_str = pay_match.group(1).strip() if pay_match else 'N/A'
            lines = text.split('\n')
            role_jobs = []
            for line in lines:
                role_match = re.search(r'^([^:]+?)\s*:\s*(https?://[^\s\n]+)', line.strip(), re.IGNORECASE)
                if role_match and not any(k in role_match.group(1).lower() for k in ['company', 'work mode', 'pay', 'apply', 'channel', 'eligibility', 'join', 'group', 'whatsapp', 'telegram']):
                    r_title = role_match.group(1).strip()
                    r_link = role_match.group(2).strip()
                    if any(social in r_link.lower() for social in ['whatsapp.com', 't.me', 'telegram.', 'youtube.com', 'youtu.be', 'instagram.com']):
                        continue
                    job = {
                        'title': r_title,
                        'company': company,
                        'location': location,
                        'apply_link': r_link,
                        'experience_years': global_exp,
                        'deadline': 'N/A'
                    }
                    if pay_str != 'N/A':
                        numbers = re.findall(r'[\d.,]+', pay_str)
                        try:
                            if len(numbers) >= 2:
                                job['salary_min'] = float(numbers[0].replace(',', ''))
                                job['salary_max'] = float(numbers[1].replace(',', ''))
                            elif len(numbers) == 1:
                                job['salary_min'] = float(numbers[0].replace(',', ''))
                                job['salary_max'] = float(numbers[0].replace(',', ''))
                        except ValueError:
                            pass
                        job['salary_currency'] = 'USD/HR' if '$' in pay_str else 'LPA'
                    role_jobs.append(job)
            if role_jobs:
                return clean_and_fallback(role_jobs)
        if not blocks:
            blocks = [text]
        parsed_jobs = []
        for block in blocks:
            job = {}
            title_match = re.search(r'(?:role|designation|position|job\s*role|job|opening)\s*:\s*([^\n]+)', block, re.IGNORECASE)
            if title_match:
                job['title'] = title_match.group(1).strip()
            else:
                header_hiring = re.search(r'🔔\s*([^\s]+)\s+Is\s+Hiring:\s*([^\n📊]+)', block, re.IGNORECASE)
                if header_hiring:
                    job['company'] = header_hiring.group(1).strip()
                    job['title'] = header_hiring.group(2).strip()
                else:
                    header_new = re.search(r'New\s+Hiring\s*\|\s*([^\s|]+)\s+Off\s+Campus', block, re.IGNORECASE)
                    if header_new:
                        job['company'] = header_new.group(1).strip()
                    else:
                        header_amp = re.search(r'New\s+([^\s|]+)\s+AMP\s+Program', block, re.IGNORECASE)
                        if header_amp:
                            job['company'] = header_amp.group(1).strip()
            if not job.get('company'):
                company_match = re.search(r'(?:company|organization)\s*:\s*([^\n]+)', block, re.IGNORECASE)
                if company_match:
                    job['company'] = company_match.group(1).strip()
            if not job.get('title'):
                title_fallback = re.search(r'hiring\s+for\s+([^\n|]+)', block, re.IGNORECASE)
                if title_fallback:
                    job['title'] = title_fallback.group(1).split('|')[0].strip()
            if not job.get('company') or job.get('company') == 'N/A':
                first_line = block.split('\n')[0]
                hiring_i = re.search(r'(?:Hiring\s*[Ii]\s*|Hiring\s*\|\s*)([A-Za-z0-9\s\-\.]+?)(?:\s+Off|\s+Of|\s+Drive|\s+fresher|\s+Recruitment|\s+Mega|$)', first_line)
                if hiring_i:
                    job['company'] = hiring_i.group(1).strip()
                else:
                    m = re.search(r'^([A-Za-z0-9\s\-\.]+?)\s+(?:MASS\s+Hiring|Hiring|Off\s+Campus|Recruitment|Drive)\b', first_line, re.IGNORECASE)
                    if m:
                        job['company'] = m.group(1).strip()
                    else:
                        job['company'] = 'N/A'
            if not job.get('title'):
                job['title'] = 'Job Opening'
            location_match = re.search(r'(?:location|city|place|job\s*location|work\s+mode)\s*:\s*([^\n]+)', block, re.IGNORECASE)
            if location_match:
                job['location'] = location_match.group(1).strip()
            else:
                job['location'] = 'N/A'
            salary_match = re.search(r'(?:salary\s*package|salary|ctc|package|pay|stipend)\s*:\s*([^(\n]+)', block, re.IGNORECASE)
            if salary_match:
                sal_str = salary_match.group(1).replace('₹', '').replace('Rs.', '').replace('Rs', '').strip()
                if re.search(r'\b(unpaid|no stipend)\b', sal_str, re.IGNORECASE):
                    job['salary_min'] = 0.0
                    job['salary_max'] = 0.0
                    job['salary_currency'] = 'UNPAID'
                else:
                    range_match = re.search(r'([\d.,]+)\s*(?:-|–|to)\s*([\d.,]+)\s*(lpa|lakhs|k|usd|inr|\$)?', sal_str, re.IGNORECASE)
                    if range_match:
                        try:
                            job['salary_min'] = float(range_match.group(1).replace(',', ''))
                            job['salary_max'] = float(range_match.group(2).replace(',', ''))
                            job['salary_currency'] = range_match.group(3).strip().upper() if range_match.group(3) else 'LPA'
                        except ValueError:
                            pass
                    else:
                        single_match = re.search(r'([\d.,]+)\s*(lpa|lakhs|k|usd|inr|\$)?', sal_str, re.IGNORECASE)
                        if single_match:
                            try:
                                job['salary_min'] = float(single_match.group(1).replace(',', ''))
                                job['salary_max'] = float(single_match.group(1).replace(',', ''))
                                job['salary_currency'] = single_match.group(2).strip().upper() if single_match.group(2) else 'LPA'
                            except ValueError:
                                pass
            exp_match = re.search(r'(?:experience|years)\s*:\s*([^\n]+)', block, re.IGNORECASE)
            if exp_match:
                job['experience_years'] = exp_match.group(1).strip()
            else:
                job['experience_years'] = 'N/A'
            deadline_match = re.search(r'(?:deadline|apply\s*by|last\s*date\s*to\s*apply)\s*:\s*([^\n]+)', block, re.IGNORECASE)
            if deadline_match:
                job['deadline'] = deadline_match.group(1).strip()
            else:
                job['deadline'] = 'N/A'
            links = re.findall(r'(https?://[^\s\n]+)', block)
            apply_link = ''
            for link in links:
                if 'whatsapp.com' not in link and 't.me' not in link and 'telegram.org' not in link:
                    apply_link = link
                    break
            if not apply_link and links:
                apply_link = links[0]
            job['apply_link'] = apply_link
            parsed_jobs.append(job)
        return clean_and_fallback(parsed_jobs)

    def get_experience_category(self, title: str, exp_str: str) -> str:
        t = (title or '').lower()
        e = (exp_str or 'N/A').lower()
        if 'intern' in t or 'intern' in e:
            return 'Intern'
        numbers = re.findall(r'\d+', e)
        if numbers:
            years = max(int(n) for n in numbers)
            if years <= 2:
                return 'Entry-level'
            if years <= 5:
                return 'Mid-level'
            return 'Senior'
        if any(x in e for x in ['fresher', 'entry', '0-2', '0-1']) or any(x in t for x in ['fresher', 'graduate']):
            return 'Entry-level'
        if any(x in e for x in ['senior', 'lead', 'manager']) or any(x in t for x in ['senior', 'lead', 'manager']):
            return 'Senior'
        if 'mid' in e or 'intermediate' in e or '3-5' in e:
            return 'Mid-level'
        return 'Not Specified'

    async def scrape_channel(
        self,
        channel_username: str,
        max_messages: int = 200,
        must_include_keywords: List[str] = None,
        exclude_keywords: List[str] = None,
        start_date: str = None,
        end_date: str = None,
        experience_levels: List[str] = None,
        min_salary: float = None,
        max_salary: float = None,
    ) -> int:
        """Scrapes job postings from a single Telegram channel"""
        if not channel_username.startswith('@'):
            channel_username = f'@{channel_username}'

        must_include_keywords = must_include_keywords or []
        exclude_keywords = exclude_keywords or []
        experience_levels = experience_levels or []

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

        try:
            entity = await self.client.get_entity(channel_username)

            if not isinstance(entity, Channel):
                print(f"'{channel_username}' is not a channel")
                return 0

            jobs_found = 0
            jobs_parsed_list = []

            async for message in self.client.iter_messages(entity, limit=max_messages):
                if not message.text:
                    continue

                if message.date:
                    msg_date = message.date.date()
                    if start_dt and msg_date < start_dt:
                        break
                    if end_dt and msg_date > end_dt:
                        continue

                if exclude_keywords:
                    text_lower = message.text.lower()
                    if any(kw.lower() in text_lower for kw in exclude_keywords):
                        continue

                if must_include_keywords:
                    text_lower = message.text.lower()
                    if not all(kw.lower() in text_lower for kw in must_include_keywords):
                        continue

                jobs_parsed = self.parse_job_message(message.text)

                if jobs_parsed:
                    for idx, job in enumerate(jobs_parsed):
                        if experience_levels:
                            job_exp = self.get_experience_category(job.get('title', ''), job.get('experience_years', ''))
                            if job_exp not in experience_levels:
                                continue
                        
                        j_min = job.get('salary_min')
                        j_max = job.get('salary_max')
                        j_curr = job.get('salary_currency')

                        if min_salary is not None or max_salary is not None:
                            if j_min is None and j_max is None:
                                continue 
                            
                            c_min = j_min if j_min is not None else j_max
                            c_max = j_max if j_max is not None else j_min

                            if j_curr == 'USD':
                                c_min = c_min * 83 / 100000 
                                c_max = c_max * 83 / 100000
                            elif j_curr in ['K', 'INR'] and c_max and c_max > 1000:
                                c_min = c_min / 100000
                                c_max = c_max / 100000
                            
                            if min_salary is not None and c_max < min_salary:
                                continue
                            if max_salary is not None and c_min > max_salary:
                                continue

                        job['channel_name'] = entity.title or channel_username
                        job['message_id'] = message.id
                        job['raw_text'] = message.text
                        job['id'] = f"{channel_username}_{message.id}_{idx}"
                        jobs_parsed_list.append(job)

            if jobs_parsed_list:
                conn = sqlite3.connect(self.db_path, timeout=10)
                try:
                    conn.execute('PRAGMA journal_mode=WAL')
                    cursor = conn.cursor()
                    for job in jobs_parsed_list:
                        try:
                            cursor.execute('''
                                INSERT OR IGNORE INTO jobs (
                                    id, title, company, location, salary_min, salary_max,
                                    salary_currency, experience_years, deadline, apply_link,
                                    channel_name, message_id, raw_text
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            ''', (
                                job['id'],
                                job.get('title', 'N/A'),
                                job.get('company', 'N/A'),
                                job.get('location', 'N/A'),
                                job.get('salary_min'),
                                job.get('salary_max'),
                                job.get('salary_currency', 'INR'),
                                job.get('experience_years', 'N/A'),
                                job.get('deadline', 'N/A'),
                                job.get('apply_link', ''),
                                job['channel_name'],
                                job['message_id'],
                                job['raw_text'],
                            ))
                            jobs_found += 1
                            self.job_count += 1
                        except Exception as e:
                            print(f"Error saving job: {e}")
                    conn.commit()
                finally:
                    conn.close()

            return jobs_found

        except Exception as e:
            print(f"Error scraping channel {channel_username}: {e}")
            return 0

    async def scrape_multiple_channels(
        self,
        channels: List[str],
        max_messages: int = 200,
        must_include_keywords: List[str] = None,
        exclude_keywords: List[str] = None,
        start_date: str = None,
        end_date: str = None,
        experience_levels: List[str] = None,
        min_salary: float = None,
        max_salary: float = None,
        on_progress=None
    ) -> Dict:
        """Runs the scraper across a list of different channels"""
        total_jobs = 0
        results = {}

        for i, channel in enumerate(channels):
            if not self.is_running:
                break

            jobs = await self.scrape_channel(
                channel,
                max_messages,
                must_include_keywords,
                exclude_keywords,
                start_date,
                end_date,
                experience_levels,
                min_salary,
                max_salary
            )
            
            results[channel] = jobs
            total_jobs += jobs

            if on_progress:
                progress = ((i + 1) / len(channels)) * 100
                on_progress({
                    'channel': channel,
                    'jobs': jobs,
                    'total': total_jobs,
                    'progress': progress,
                })

        return {
            'total_jobs': total_jobs,
            'channels': results,
            'timestamp': datetime.now().isoformat(),
        }

    async def get_jobs_from_db(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Fetches a page of scraped job postings from the database"""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('''
            SELECT * FROM jobs
            ORDER BY scraped_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))

        jobs = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jobs

    async def get_job_count(self) -> int:
        """Returns the total number of scraped jobs we have in the database"""
        conn = sqlite3.connect(self.db_path, timeout=10)
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) FROM jobs')
        count = cursor.fetchone()[0]
        conn.close()

        return count

    def stop(self):
        self.is_running = False
        print("[Scraper] Stopping scraper...")
