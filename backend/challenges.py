from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as bm
from deps import get_current_user

router = APIRouter()

challenges = [
    {
        "id": 1,
        "title": "Basic Web",
        "description": "Find the hidden flag in the page",
        "flag": "flag{easy_web}",
        "points": 20,
        "category": "web",
        "difficulty": "easy",
        "hints": ["Check page source", "Look for hidden elements"]
    },
    {
       "id": 2,
       "title": "Crypto Intro",
       "description": "Decode the message",
       "flag": "flag{crypto123}",
       "points": 20,
       "category": "crypto",
       "difficulty": "medium",
       "hints": ["Try base64", "Look for patterns"]
    }
]

submissions =[]

class FlagSubmission(bm):
    challenge_id: int
    flag: str


@router.get("/challenges")
def get_challenges(user: str = Depends(get_current_user), category: str = None, difficulty: str = None):
    result = challenges
    if category:
        result = [c for c in result if c["category"] == category]
    if difficulty:
        result = [c for c in result if c["difficulty"] == difficulty]
    return[
        {
            "id": c["id"],
            "title": c["title"],
            "description": c["description"],
            "points": c["points"],
            "category": c["category"],
            "difficulty": c["difficulty"],
            "solved": c["id"] in [
                s["challenge_id"]
                for s in submissions
                if s["user"] == user
            ]
        }
        for c in result
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
    
    leaderboard = [
        {"user": u, "score": score}
        for u, score in scores.items()
    ]
    leaderboard.sort(key=lambda x: x["score"], reverse=True)

    return leaderboard

@router.get("/hints/{challenge_id}")
def get_hints(challenge_id: int, user: str = Depends(get_current_user)):
    for c in challenges:
        if c["id"] == challenge_id:
            return {"hints": c["hints"]}
    raise HTTPException(status_code=404, detail="Challenge not found")

@router.get("/solved")
def get_solved(user: str = Depends(get_current_user)):
    solved_ids = [
        s["challenge_id"]
        for s in submissions
        if s["user"] == user
    ]
    return {"solved": solved_ids}


class ChallengeCreate(bm):
    title: str
    description:str
    flag: str
    points: int
    category: str
    difficulty: str
    hints: list[str]

def is_admin(user: str):
    return user == "admin"

@router.post("/admin/create")
def create_challenge(data: ChallengeCreate, user: str = Depends(get_current_user)):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admins only")
    new_id = max([c["id"] for c in challenges]) + 1 if challenges else 1

    challenges.append({
        "id": new_id,
        "title": data.title,
        "description": data.description,
        "flag": data.flag,
        "points": data.points,
        "category": data.category,
        "difficulty": data.difficulty,
        "hints": data.hints
    })

    return {"message": "Challenge created"}


@router.delete("/admin/delete/{challenge_id}")
def delete_challenge(challenge_id: int, user: str = Depends(get_current_user)):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admins only")
    
    for c in challenges:
        if c["id"]== challenge_id:
            challenges.remove(c)
            return {"message": "Deleted"}
        
    raise HTTPException(status_code=404, detail="Not found")

@router.put("/admin/edit/{challenge_id}")
def edit_challenge(challenge_id: int, data: ChallengeCreate, user: str = Depends(get_current_user)):
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admins only!")
    
    for c in challenges:
        if c["id"] == challenge_id:
            c.update(data.dict())
            return {"message": "Updated"}
        
    raise HTTPException(status_code=404, detail="Not found")