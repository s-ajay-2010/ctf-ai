from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from jose.exceptions import JWTError
import os
from models import users

load_dotenv()
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = payload.get("sub")

        if user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        if user not in [u["username"] for u in users]:
            raise HTTPException(status_code=401, detail="User no longer exists")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")