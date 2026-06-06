import sqlite3
import json
import os

def query_youtube_links():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'flux.db')
    if not os.path.exists(db_path):
        return []

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='youtube_links'")
        if not cursor.fetchone():
            conn.close()
            return []
            
        cursor.execute('SELECT * FROM youtube_links ORDER BY date_added DESC LIMIT 500')
        rows = cursor.fetchall()
        
        links = [dict(row) for row in rows]
        return links
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    import json
    result = query_youtube_links()
    print(json.dumps({"success": True, "links": result}))
