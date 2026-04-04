from fastapi import FastAPI as fahh

app = fahh()

@app.get("/")
def home():
    return{"message": "CTF backend is ready!!"}