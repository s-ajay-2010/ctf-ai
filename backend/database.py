import sqlite3

conn = sqlite3.connect("ctf.db", check_same_thread=False)
def get_cursor():
    return conn.cursor()

def init_db():
    cursor = get_cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            title TEXT,
            description TEXT,
            flag TEXT,
            points INTEGER,
            category TEXT,
            difficulty TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT,
            challenge_id INTEGER
        )
    """)


    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER,
            hint TEXT
        )
    """)

    conn.commit()