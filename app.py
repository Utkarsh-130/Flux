import os
import sys
import json
import asyncio
import subprocess
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

sys.path.append(os.path.join(os.path.dirname(__file__), 'python-backend'))

from query_jobs import query_jobs
from query_youtube_links import query_youtube_links
from clear_youtube_links import clear_youtube_links
from telethon_auth import TelegramAuth

import run_scraper

if len(sys.argv) > 1 and sys.argv[1] == '--run-scraper':
    run_scraper.sys.argv = ['run_scraper.py'] + sys.argv[2:]
    asyncio.run(run_scraper.main())
    sys.exit(0)

if getattr(sys, 'frozen', False):
    static_folder = os.path.join(sys._MEIPASS, 'out')
else:
    static_folder = os.path.join(os.path.dirname(__file__), 'out')

app = Flask(__name__, static_folder=static_folder)
CORS(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    elif path != "" and os.path.exists(os.path.join(app.static_folder, path + '.html')):
        return send_from_directory(app.static_folder, path + '.html')
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/jobs', methods=['GET'])
def api_jobs():
    jobs = query_jobs()
    return jsonify(jobs)

@app.route('/api/youtube-links', methods=['GET'])
def api_yt_links():
    links = query_youtube_links()
    return jsonify(links)

@app.route('/api/youtube-links/clear', methods=['POST'])
def api_yt_clear():
    clear_youtube_links()
    return jsonify({"success": True})

@app.route('/api/auth/send-otp', methods=['POST'])
def api_send_otp():
    data = request.json
    phone = data.get('phone')
    
    async def _send():
        auth = TelegramAuth(session_name='flux_session')
        phone_code_hash = await auth.request_code(phone)
        await auth.disconnect()
        return phone_code_hash
        
    try:
        phone_code_hash = asyncio.run(_send())
        if phone_code_hash:
            return jsonify({"success": True, "phone_code_hash": phone_code_hash})
        else:
            return jsonify({"success": False, "error": "Failed to request code"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/auth/verify-otp', methods=['POST'])
def api_verify_otp():
    data = request.json
    phone = data.get('phone')
    code = data.get('code')
    phone_code_hash = data.get('phone_code_hash')
    
    if not phone or not code:
        return jsonify({"success": False, "error": "Phone number and code are required"}), 400
    
    
    async def _verify():
        auth = TelegramAuth(session_name='flux_session')
        success = await auth.verify_code(phone, code, phone_code_hash)
        await auth.disconnect()
        return success

    try:
        success = asyncio.run(_verify())
        if success:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Invalid OTP"}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/auth/status', methods=['GET'])
def api_auth_status():
    async def _check_status():
        auth = TelegramAuth(session_name='flux_session')
        is_auth = await auth.is_authenticated()
        user = None
        if is_auth:
            user = await auth.get_me()
        await auth.disconnect()
        return is_auth, user

    try:
        is_auth, user = asyncio.run(_check_status())
        return jsonify({
            "authenticated": is_auth,
            "user": user
        })
    except Exception as e:
        return jsonify({"authenticated": False, "error": str(e)}), 500

@app.route('/api/scraper/run', methods=['POST'])
def api_run_scraper():
    data = request.json
    must_have = data.get('must_have', '')
    exclude = data.get('exclude', '')
    max_messages = str(data.get('max_messages', 200))
    start_date = data.get('start_date', '')
    end_date = data.get('end_date', '')
    experience_levels = data.get('experience_levels', '')
    youtube_channels = data.get('youtube_channels', '')
    scrape_telegram = str(data.get('scrape_telegram', 'true')).lower()
    min_salary = str(data.get('min_salary', ''))
    max_salary = str(data.get('max_salary', ''))

    def generate():
        if getattr(sys, 'frozen', False):
            cmd = [
                sys.executable, '--run-scraper',
                must_have, exclude, max_messages, start_date, end_date, experience_levels, youtube_channels, scrape_telegram, min_salary, max_salary
            ]
        else:
            cmd = [
                sys.executable, 
                os.path.join(os.path.dirname(__file__), 'python-backend', 'run_scraper.py'),
                must_have, exclude, max_messages, start_date, end_date, experience_levels, youtube_channels, scrape_telegram, min_salary, max_salary
            ]
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8')
        for line in iter(process.stdout.readline, ''):
            yield line
        process.stdout.close()
        process.wait()

    from flask import Response
    return Response(generate(), mimetype='text/plain')

import threading
if __name__ == '__main__':
    app.run(port=5000, host="0.0.0.0")
