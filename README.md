# CTF-WEB

A custom begginer-friendly CTF platform built with FastAPI, SQLite, HTML/CSS/JS

## Features:
- JWT Auth
- 3 Demo Challenges with a possible scaliblity.
- Scoreboard.
- First-Blood tracking.
- A MVP Admin Panel with default admin credential as "admin":"admin".
- A category-wise filtering system for challenge viewing.
- Deduct points for revealing each hint.

## Setup:
```bash
pip install -r requirements.txt
python -m uvicorn main:app --reload #run in the backend directory or in the directory that has the main.py file:)
``` 
All others are self-explanatory I hope and the 3 Demo challenges are in the attached video, so please refer to it and all the demo users are removed so feel free to create mew ones during testing or local use:)