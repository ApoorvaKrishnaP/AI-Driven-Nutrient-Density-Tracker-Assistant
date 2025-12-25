from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from backend import database  # ensures DB tables are created at startup
from backend.routes import auth, predictor, chatbot
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Calculator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predictor.router)
app.include_router(chatbot.router)

# Serve static files from the React public directory (optional, but keeps compatibility)
app.mount("/static", StaticFiles(directory="frontend-react/public"), name="static")

# Note: The root "/" and "/login" routes are now handled by the React Frontend (Vite).
# We removed the @app.get("/") and @app.get("/login") handlers because they relied on missing HTML files.
# Users should access the app via http://localhost:5173 (or whatever port Vite uses).
database.init_db()




