import re
import unicodedata
from typing import Optional, Dict, Any
from enum import Enum

class MessageParser:
    """Helper to extract structured job details from text messages"""

    EMOJIS = {
        '💼': 'job_role',
        '🏢': 'company',
        '📍': 'location',
        '📋': 'qualifications',
        '💰': 'salary',
        '💻': 'job_type',
        '📈': 'experience',
        '📅': 'deadline',
        '🔗': 'apply_link',
    }

    @staticmethod
    def parse_message(text: str, channel_name: str = '', message_id: int = 0) -> Optional[Dict[str, Any]]:
        """Parses a job posting text into structured dictionary fields"""
        
        job_data = {
            'title': '',
            'company': '',
            'location': '',
            'qualifications': '',
            'salary_min': None,
            'salary_max': None,
            'salary_currency': 'INR',
            'job_type': '',
            'experience_years': '',
            'deadline': '',
            'apply_link': '',
            'channel_name': channel_name,
            'message_id': message_id,
        }

        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue

            norm_line = unicodedata.normalize('NFKD', line).encode('ascii', 'ignore').decode('utf-8').strip()
            norm_lower = norm_line.lower()

            if line.startswith('📌') or 'job' in line.lower() or 'role' in line.lower():
                match = re.search(r'(?:📌|Job|Role)[:\s]+(.+?)(?:\s+\(|$)', line, re.IGNORECASE)
                if match:
                    job_data['title'] = match.group(1).strip()
                elif line.startswith('📌'):
                    job_data['title'] = line.replace('📌', '', 1).split(':', 1)[-1].strip()

            elif line.startswith('🏢') or 'company' in line.lower():
                match = re.search(r'(?:🏢|Company)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    job_data['company'] = match.group(1).strip()
            
            elif 'hiring' in norm_lower:
                match = re.search(r'^\s*(.+?)\s+(?:is\s+)?hiring(?:(?:\s+for)?\s+(.+))?', norm_line, re.IGNORECASE)
                if match:
                    job_data['company'] = match.group(1).strip()
                    if match.group(2) and not job_data['title']:
                        job_data['title'] = match.group(2).strip()

            elif line.startswith('📍') or 'location' in line.lower():
                match = re.search(r'(?:📍|Location)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    job_data['location'] = match.group(1).strip()

            elif line.startswith('📋') or 'qualification' in line.lower():
                match = re.search(r'(?:📋|Qualification)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    job_data['qualifications'] = match.group(1).strip()

            elif line.startswith('💰') or 'salary' in line.lower():
                match = re.search(r'(?:💰|Salary)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    salary_text = match.group(1).strip()
                    salary_text_clean = salary_text.replace(',', '')
                    salary_range = re.findall(r'(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?', salary_text_clean)
                    if salary_range:
                        if salary_range[0][1]:
                            job_data['salary_min'] = float(salary_range[0][0])
                            job_data['salary_max'] = float(salary_range[0][1])
                        elif salary_range[0][0]:
                            if 'upto' in salary_text.lower() or 'up to' in salary_text.lower():
                                job_data['salary_min'] = None
                                job_data['salary_max'] = float(salary_range[0][0])
                            else:
                                job_data['salary_min'] = float(salary_range[0][0])
                                job_data['salary_max'] = None
                    
                    if 'LPA' in salary_text.upper():
                        job_data['salary_currency'] = 'INR'
                    elif '₹' in salary_text or 'INR' in salary_text.upper():
                        job_data['salary_currency'] = 'INR'
                    elif '$' in salary_text or 'USD' in salary_text.upper():
                        job_data['salary_currency'] = 'USD'

            elif line.startswith('💻') or 'job type' in line.lower():
                match = re.search(r'(?:💻|Job Type)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    job_data['job_type'] = match.group(1).strip()

            elif line.startswith('📈') or 'experience' in line.lower():
                match = re.search(r'(?:📈|Experience)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    job_data['experience_years'] = match.group(1).strip()

            elif line.startswith('📅') or 'deadline' in line.lower() or 'last date' in line.lower():
                match = re.search(r'(?:📅|Deadline|Last Date)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    deadline = match.group(1).strip()
                    job_data['deadline'] = deadline

            elif line.startswith('🔗') or 'apply' in line.lower() or 'link' in line.lower():
                match = re.search(r'(?:🔗|Apply)[:\s]+(.+)', line, re.IGNORECASE)
                if match:
                    link_text = match.group(1).strip()
                    url_match = re.search(r'https?://[^\s\)]+', link_text)
                    if url_match:
                        job_data['apply_link'] = url_match.group(0)
                    else:
                        job_data['apply_link'] = link_text

        if not job_data['company']:
            return None
            
        if not job_data['title']:
            job_data['title'] = 'Role Not Specified'

        for key in ['title', 'company', 'location', 'qualifications', 'job_type', 'experience_years', 'deadline']:
            if key in job_data and isinstance(job_data[key], str):
                job_data[key] = job_data[key].strip('*').strip()

        return job_data

    @staticmethod
    def extract_resume_skills(text: str) -> Dict[str, Any]:
        """Scans the resume text for known tools, languages, and frameworks"""
        skills = {
            'technical_skills': [],
            'languages': [],
            'tools': [],
            'frameworks': [],
            'databases': [],
        }

        tech_keywords = {
            'languages': ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP'],
            'frameworks': ['React', 'Vue', 'Angular', 'Django', 'Flask', 'FastAPI', 'Spring', 'Express', 'Next.js'],
            'databases': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle'],
            'tools': ['Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 'GitHub', 'GitLab'],
        }

        text_lower = text.lower()

        for category, keywords in tech_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    skills[category].append(keyword)

        return skills
