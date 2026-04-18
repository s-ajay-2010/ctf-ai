from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as bm
from deps import get_current_user
from database import get_cursor, conn




router = APIRouter()

class FlagSubmission(bm):
    challenge_id: int
    flag: str


@router.get("/challenges")
def get_challenges(user: str = Depends(get_current_user)):
    cursor = get_cursor()
    cursor.execute("SELECT * FROM challenges")
    challenges = cursor.fetchall()

    cursor.execute("SELECT challenge_id FROM submissions WHERE user=?", (user,))
    solved_ids = [row[0] for row in cursor.fetchall()]

    result = []
    for c in challenges:
        result.append({
            "id": c[0],
            "title": c[1],
            "description": c[2],
            "points": c[4],
            "category": c[5],
            "difficulty": c[6],
            "solved": c[0] in solved_ids
        })
    
    return result

@router.post("/submit")
def submit_flag(data: FlagSubmission, user: str = Depends(get_current_user)):
    cursor = get_cursor()
    cursor.execute("SELECT flag FROM challenges WHERE id=?", (data.challenge_id,))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Challenge not found")
    correct_flag = row[0]

    cursor.execute(
        "SELECT * FROM submissions WHERE user=? AND challenge_id=?",
        (user, data.challenge_id)
    )
    if cursor.fetchone():
        return {"message": "Already solved!!"}
    
    if data.flag == correct_flag:
        cursor.execute(
            "INSERT INTO submissions (user, challenge_id) VALUES (?, ?)",
            (user, data.challenge_id)
        )
        conn.commit()

        return {"message": "Correct flag!!!!"}
    return {"message": "Wrong Flag:("}
    


@router.get("/scoreboard")
def scoreboard(user: str = Depends(get_current_user)):
    cursor = get_cursor()
    cursor.execute("""
        SELECT user, SUM(challenges.points)
        FROM submissions
        JOIN challenges ON submissions.challenge_id = challenges.id
        WHERE user != 'admin'
        GROUP BY user
        ORDER BY SUM(challenges.points) DESC
    """)

    rows = cursor.fetchall()
    return [{"user": r[0], "score": r[1]} for r in rows]

@router.get("/hints/{challenge_id}")
def get_hints(challenge_id: int, user: str = Depends(get_current_user)):
   cursor = get_cursor()
   cursor.execute(
       "SELECT hint FROM hints WHERE challenge_id=?",
       (challenge_id,)
   )

   hints = [row[0] for row in cursor.fetchall()]

   if not hints:
       raise HTTPException(status_code=404, detail="No hints found")
   
   return {"hints": hints}

@router.get("/solved")
def get_solved(user: str = Depends(get_current_user)):
    cursor = get_cursor()
    cursor.execute(
        "SELECT challenge_id FROM submissions WHERE user=?",
        (user,)
    )

    solved_ids = [row[0] for row in cursor.fetchall()]
    return{"solved": solved_ids}


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
    cursor = get_cursor()
    if user != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    cursor.execute("""
        INSERT INTO challenges (title, description, flag, points, category, difficulty)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.title,
            data.description,
            data.flag,
            data.points,
            data.category,
            data.difficulty
        )
    )

    challenge_id = cursor.lastrowid

    for h in data.hints:
        cursor.execute(
            "INSERT INTO hints (challenge_id, hint) VALUES (?, ?)",
            (challenge_id, h)
        )
    conn.commit()
    return {"message": "Challenge created"}


@router.delete("/admin/delete/{challenge_id}")
def delete_challenge(challenge_id: int, user: str = Depends(get_current_user)):
    cursor = get_cursor()
    if user != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    
    cursor.execute("DELETE FROM challenges WHERE id=?", (challenge_id, ))
    cursor.execute("DELETE FROM hints WHERE challenge_id=?", (challenge_id, ))
    cursor.execute("DELETE FROM submissions WHERE challenge_id=?", (challenge_id, ))

    conn.commit()
    return {"message": "Deleted"}
    



@router.put("/admin/edit/{challenge_id}")
def edit_challenge(challenge_id: int, data: ChallengeCreate, user: str = Depends(get_current_user)):
    cursor = get_cursor()
    if user != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    
    cursor.execute("""
        UPDATE challenges
        SET title=?, description=?, flag=?, points=?, category=?, difficulty=?
        WHERE id=?
        """, (
            data.title,
            data.description,
            data.flag,
            data.points,
            data.category,
            data.difficulty,
            challenge_id
        )
    )

    cursor.execute("DELETE FROM hints WHERE challenge_id=?", (challenge_id, ))

    for h in data.hints:
        cursor.execute(
            "INSERT INTO hints (challenge_id, hint) VALUES (?, ?)",
            (challenge_id, h)
        )

    conn.commit()
    return {"message": "Updated"}


@router.get("/admin/challenges")
def admin_get_challenges(user: str = Depends(get_current_user)):
    cursor = get_cursor()
    if user != "admin":
        raise HTTPException(status_code=403, detail="Admins only")
    
    cursor.execute("SELECT * FROM challenges")
    rows = cursor.fetchall()

    return[
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "flag": r[3],
            "points": r[4],
            "category": r[5],
            "difficulty": r[6]
        }
        for r in rows
    ]


