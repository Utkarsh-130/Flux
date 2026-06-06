import sqlite3
import json
import os

db_path = 'flux.db'

def query_jobs():
    if not os.path.exists(db_path):
        return []
    try:
        conn = sqlite3.connect(db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("DELETE FROM jobs WHERE scraped_at < datetime('now', '-7 days') AND id NOT IN (SELECT job_id FROM applications)")
        conn.commit()
        cursor.execute("SELECT * FROM jobs ORDER BY scraped_at DESC")
        rows = cursor.fetchall()
        jobs = []
        for r in rows:
            job = dict(r)
            job['id'] = str(job['id'])
            job['dateString'] = job['scraped_at'].split(' ')[0] if job.get('scraped_at') else '2026-06-02'
            min_sal = job.get('salary_min')
            max_sal = job.get('salary_max')
            curr = job.get('salary_currency', 'INR')
            if curr == 'UNPAID':
                job['salary'] = 'Unpaid'
            else:
                job['salary'] = f"{min_sal} - {max_sal} {curr}" if min_sal else 'N/A'
            title = job.get('title', '').lower()
            from parser import MessageParser
            text_to_scan = job.get('title', '') + ' ' + (job.get('qualifications') or '')
            skills_dict = MessageParser.extract_resume_skills(text_to_scan)
            all_skills = []
            for k, v in skills_dict.items():
                all_skills.extend(v)
            
            if not all_skills:
                if 'react' in title or 'javascript' in title or 'node' in title:
                    all_skills = ['React', 'JavaScript']
                elif 'python' in title or 'django' in title or 'fastapi' in title:
                    all_skills = ['Python', 'Django']
                else:
                    all_skills = ['Communication', 'Teamwork']

            job['requiredSkills'] = list(set(all_skills))
            comp = job.get('company', 'JR')
            job['initials'] = comp[:2].upper() if comp else 'JR'
            job['color'] = 'bg-blue-100 text-blue-700'
            job['snippet'] = job.get('raw_text', '')[:120] + '...' if job.get('raw_text') else ''
            jobs.append(job)
        conn.close()
        return jobs
    except Exception as e:
        return []

if __name__ == '__main__':
    print(json.dumps(query_jobs()))
