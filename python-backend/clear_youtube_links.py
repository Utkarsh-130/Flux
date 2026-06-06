import sqlite3
import json
import os

def clear_youtube_links():
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'flux.db')
    if not os.path.exists(db_path):
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='youtube_links'")
        if cursor.fetchone():
            cursor.execute('DELETE FROM youtube_links')
            conn.commit()
            
        return
        
    except Exception as e:
        print(f"Error clearing links: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    import json
    clear_youtube_links()
    print(json.dumps({"success": True}))
