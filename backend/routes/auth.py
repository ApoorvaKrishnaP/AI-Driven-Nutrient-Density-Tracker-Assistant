from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend import database, schemas
from backend.utils.hashing import hash_password, verify_password
from backend.utils.jwt_handler import create_access_token, verify_token
from backend.database import get_db, User

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

@router.post("/register")
#Role of decorators,auth prefix
#In schemas.Usercreate,fastAPI validates user input
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(username=user.username, password_hash=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": db_user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/preferences")
def save_preferences(prefs: schemas.UserPreferencesCreate, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    
    # Check if preferences exist
    db_prefs = db.query(database.UserPreferences).filter(database.UserPreferences.user_id == user.id).first()
    if db_prefs:
        # Update existing
        db_prefs.diet_type = prefs.diet_type
        db_prefs.is_low_sugar = prefs.is_low_sugar
        db_prefs.is_low_carb = prefs.is_low_carb
        db_prefs.is_lactose_free = prefs.is_lactose_free
        db_prefs.primary_goal = prefs.primary_goal
    else:
        # Create new
        new_prefs = database.UserPreferences(
            user_id=user.id,
            diet_type=prefs.diet_type,
            is_low_sugar=prefs.is_low_sugar,
            is_low_carb=prefs.is_low_carb,
            is_lactose_free=prefs.is_lactose_free,
            primary_goal=prefs.primary_goal
        )
        db.add(new_prefs)
    
    db.commit()
    return {"message": "Preferences saved"}

@router.get("/preferences")
def get_preferences(db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    user = db.query(User).filter(User.username == current_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    prefs = db.query(database.UserPreferences).filter(database.UserPreferences.user_id == user.id).first()
    if not prefs:
        return {} # Return empty if not set
        
    return {
        "diet_type": prefs.diet_type,
        "is_low_sugar": prefs.is_low_sugar,
        "is_low_carb": prefs.is_low_carb,
        "is_lactose_free": prefs.is_lactose_free,
        "primary_goal": prefs.primary_goal
    }
