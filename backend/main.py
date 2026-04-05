from jose.exceptions import JWTError
from dotenv import load_dotenv
import os
from fastapi import FastAPI as fahh
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel as bm
from passlib.context import CryptContext as cc
from jose import jwt
from datetime import datetime, timedelta, timezone
from challenges import router as challenge_router
from deps import get_current_user

load_dotenv()
SECRET_KEY =os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not in environment")

security = HTTPBearer()

ALGORITHM = "HS256"


pwd_context = cc(schemes=["bcrypt"], deprecated="auto")
app=fahh()

users=[]
login_attempts= {}

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
    for u in users:
        if u["username"] == user.username:
            raise HTTPException(status_code=400, detail="User already exists!!")
    
    users.append({
        "username": user.username,
        "password": hash_password(user.password)
    })

    return {"msg": "User registered successfully"}

@app.post("/login")
def login(user: User):
    attempts = login_attempts.get(user.username, 0)
    if attempts>=5:
        raise HTTPException(status_code=429, detail="Too many attempts")
    for u in users:
        if u["username"] == user.username and verify_password(user.password, u["password"]):
            login_attempts[user.username] =0
            token = create_token({"sub": user.username, "type": "access"})
            return {"access_token": token, "token_type": "bearer"}
    
    login_attempts[user.username] = attempts+1        
    raise HTTPException(status_code=401, detail="Invaild username or password.")


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