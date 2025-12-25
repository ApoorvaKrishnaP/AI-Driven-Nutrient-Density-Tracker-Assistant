from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import datetime

# Use a project-local SQLite file (not 'nutrition_app.db') so DB is persistent and easy to find.
# Stored in the workspace root as 'nutrition.db'.
DATABASE_URL = "sqlite:///./nutrition.db"

# For SQLite and FastAPI, allow check_same_thread=False
engine = create_engine(DATABASE_URL, echo=True, connect_args={"check_same_thread": False})
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True)
    password_hash = Column(String)

    meals = relationship("MealHistory", back_populates="user")
# Add this to your database models file (e.g., backend/database.py)

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Link to your user
    
    # Layer 1: Diet Type (Store as string)
    diet_type = Column(String)  # 'vegan', 'vegetarian', 'non_veg'
    
    # Layer 2: Restrictions (Store as Booleans for easy filtering)
    is_low_sugar = Column(Boolean, default=False)
    is_low_carb = Column(Boolean, default=False)
    is_lactose_free = Column(Boolean, default=False)
    
    # Layer 3: Main Goal
    primary_goal = Column(String) # 'muscle', 'weight_loss', 'maintenance'

class MealHistory(Base):
    __tablename__ = "meal_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    meal_name = Column(String)

   
    Carbohydrates = Column(Float, default=0.0)
    Potassium = Column(Float, default=0.0)
    Sugars = Column(Float, default=0.0)
    Protein = Column(Float, default=0.0)
    Dietary_Fiber = Column(Float, default=0.0)
    Cholesterol = Column(Float, default=0.0)
    Sodium = Column(Float, default=0.0)
    Water = Column(Float, default=0.0)
    Vitamin_A = Column(Float, default=0.0)
    Vitamin_B1 = Column(Float, default=0.0)
    Vitamin_B11 = Column(Float, default=0.0)
    Vitamin_B12 = Column(Float, default=0.0)
    Vitamin_B2 = Column(Float, default=0.0)
    Vitamin_B3 = Column(Float, default=0.0)
    Vitamin_B5 = Column(Float, default=0.0)
    Vitamin_B6 = Column(Float, default=0.0)
    Vitamin_C = Column(Float, default=0.0)
    Vitamin_D = Column(Float, default=0.0)
    Vitamin_E = Column(Float, default=0.0)
    Vitamin_K = Column(Float, default=0.0)
    Calcium = Column(Float, default=0.0)
    Copper = Column(Float, default=0.0)
    Iron = Column(Float, default=0.0)
    Magnesium = Column(Float, default=0.0)
    Manganese = Column(Float, default=0.0)
    Phosporus = Column(Float, default=0.0)
    Selenium = Column(Float, default=0.0)
    Zinc = Column(Float, default=0.0)
    prediction = Column(Float)  # Nutrition Density
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="meals")

def init_db():
    Base.metadata.create_all(bind=engine)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



