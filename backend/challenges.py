from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as bm
from main import get_current_user

router = APIRouter()

challenges = [
    {
        "id": 1,
        "title": "Basic Web",
        "description": "Find the hidden flag in the page",
        "flag": "flag{easy_web}",
        "points": 20,
        "category": "web",
        "difficulty": "easy"
    },
    {
       "id": 2,
       "title": "Crypto Intro",
       "description": "Decode the message",
       "flag": "flag{crypto123}",
       "points": 20,
       "category": "crypto",
       "difficulty": "medium" 
    }
]

submissions =[]

class FlagSubmission(bm):
    challenge_id: int
    flag: str


@router.get("/challenges")
def get_challenges(user: str = Depends(get_current_user)):
    return[
        {
            "id": c["id"],
            "title": c["title"],
            "description": c["description"],
            "points": c["points"],
            "category": c["category"],
            "difficulty": c["difficulty"]
        }
        for c in challenges
    ]

@router.post("/submit")
def submit_flag(data: FlagSubmission, user: str = Depends(get_current_user)):
    for c in challenges:
        if c["id"] == data.challenge_id:

            for s in submissions:
                if s["user"] == user and s["challenge_id"] == c["id"]:
                    return {"message": "Already solved bruh (-_-)"}
            
            if c["flag"]  == data.flag:
                submissions.append({"user": user, "challenge_id": c["id"]})
                return{"message": "Correct Flag!!!"}
            
            return {"message": "Wrong Flag:("}
    raise HTTPException(status_code=404, detail="Challenge not found.")
    


@router.get("/scoreboard")
def scoreboard(user: str = Depends(get_current_user)):
    scores ={}

    for s in submissions:
        scores.setdefault(s["user"], 0)

        for c in challenges:
            if c["id"] == s["challenge_id"]:
                scores[s["user"]] += c["points"]

    return scores