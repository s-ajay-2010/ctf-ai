from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from jose.exceptions import JWTError
import os
from database import get_cursor

load_dotenv()
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = payload.get("sub")

        if not isinstance(user, str):
            raise HTTPException(status_code=401, detail="Invalid token payload")
        print(f"USER FROM TOKEN: {user}")

        if user is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        cursor = get_cursor()
        cursor.execute("SELECT username FROM users WHERE username=?", (user, ))
        db_user = cursor.fetchone()

        if not db_user:
            raise HTTPException(status_code=401, detail="User no longer exists")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")