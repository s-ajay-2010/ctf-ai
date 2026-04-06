from dotenv import load_dotenv
import os
from fastapi import FastAPI as fahh
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel as bm
from passlib.context import CryptContext as cc
from jose import jwt
from jose.exceptions import JWTError
from datetime import datetime, timedelta, timezone
from challenges import router as challenge_router
from deps import get_current_user
from models import users, login_attempts
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, cursor, conn

init_db()

load_dotenv()
SECRET_KEY =os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not in environment")

security = HTTPBearer()

ALGORITHM = "HS256"


pwd_context = cc(schemes=["bcrypt"], deprecated="auto")
app=fahh()
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class User(bm):
    username:str
    password:str

def hash_password(password: str):
    # print("Length:", len(password))
    return pwd_context.hash(password[:72])

def verify_password(plain, hashed):
    return pwd_context.verify(plain[:72], hashed)



@app.get("/")
def home():
    return{"message": "CTF backend is ready!!"}



@app.post("/register")
def register(user: User):
    cursor.execute("SELECT * FROM users WHERE username=?", (user.username,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="User exists")
    
    cursor.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        (user.username, hash_password(user.password))
    )

    conn.commit()

    return {"msg": "User registered successfully"}

@app.post("/login")
def login(user: User):
    cursor.execute("SELECT * FROM users WHERE username=?", (user.username, ))
    db_user = cursor.fetchone()

    if db_user and verify_password(user.password, db_user[2]):
        token = create_token({"sub": user.username})
        return {"access_token": token}

    raise HTTPException(status_code=401, detail="Invalid username or password.")


def create_token(data: dict):
    to_encode = data.copy()
    now =datetime.now(timezone.utc)
    expire = now + timedelta(hours=1)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)




@app.get("/protected")
def protected(user: str = Depends(get_current_user)):
    return{"message": f"Hello {user}, you are authenticated"}


app.include_router(challenge_router)