import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

class Database:
    def __init__(self, db_path: str = "flux.db"):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_connection()
        conn.execute('PRAGMA journal_mode=WAL')
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                qualifications TEXT,
                salary_min REAL,
                salary_max REAL,
                salary_currency TEXT DEFAULT 'INR',
                job_type TEXT,
                experience_years TEXT,
                deadline TEXT,
                apply_link TEXT,
                channel_name TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                message_id INTEGER UNIQUE,
                UNIQUE(message_id, channel_name)
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

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                status TEXT DEFAULT 'wishlist',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS resume_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                extracted_text TEXT,
                parsed_skills TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        conn.commit()
        conn.close()

    def add_job(self, job_data: Dict[str, Any]) -> Optional[int]:
        """Saves a new job or ignores it if we already have it"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO jobs (
                    title, company, location, qualifications,
                    salary_min, salary_max, salary_currency,
                    job_type, experience_years, deadline, apply_link,
                    channel_name, message_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                job_data.get('title'),
                job_data.get('company'),
                job_data.get('location'),
                job_data.get('qualifications'),
                job_data.get('salary_min'),
                job_data.get('salary_max'),
                job_data.get('salary_currency', 'INR'),
                job_data.get('job_type'),
                job_data.get('experience_years'),
                job_data.get('deadline'),
                job_data.get('apply_link'),
                job_data.get('channel_name'),
                job_data.get('message_id'),
            ))
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error adding job: {e}")
            return None
        finally:
            conn.close()

    def get_jobs(self, limit: int = 100, offset: int = 0, channel: Optional[str] = None) -> List[Dict]:
        """Fetches jobs from the database, optionally filtering by channel"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM jobs'
        params = []
        
        if channel:
            query += ' WHERE channel_name = ?'
            params.append(channel)
        
        query += ' ORDER BY scraped_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def add_channel(self, channel_username: str, channel_name: str = '') -> Optional[int]:
        """Adds a Telegram channel to our watch list"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO channels (channel_username, channel_name)
                VALUES (?, ?)
            ''', (channel_username, channel_name or channel_username))
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error adding channel: {e}")
            return None
        finally:
            conn.close()

    def get_channels(self, enabled_only: bool = True) -> List[Dict]:
        """Gets the list of channels we are tracking"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM channels'
        if enabled_only:
            query += ' WHERE enabled = 1'
        
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def remove_channel(self, channel_id: int) -> bool:
        """Removes a channel by its ID"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('DELETE FROM channels WHERE id = ?', (channel_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def add_application(self, job_id: int, status: str = 'wishlist', notes: str = '') -> Optional[int]:
        """Starts tracking an application for a specific job"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO applications (job_id, status, notes)
                VALUES (?, ?, ?)
            ''', (job_id, status, notes))
            conn.commit()
            return cursor.lastrowid
        finally:
            conn.close()

    def update_application(self, app_id: int, status: str = '', notes: str = '') -> bool:
        """Updates status or notes for an active job application"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            updates = []
            params = []
            
            if status:
                updates.append('status = ?')
                params.append(status)
            if notes:
                updates.append('notes = ?')
                params.append(notes)
            
            if not updates:
                return True
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(app_id)
            
            query = f"UPDATE applications SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, params)
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def get_job_count(self) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM jobs')
        count = cursor.fetchone()[0]
        conn.close()
        return count
