import os
from datetime import timedelta
from dotenv import load_dotenv

# Charge les variables du fichier .env dans os.environ
load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-a-changer")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///boutique.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    APP_PASSWORD = os.environ.get("APP_PASSWORD", "motdepasse123")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    # Une fois connectée, elle reste connectée 90 jours (cf. discussion "pas besoin de retaper le mot de passe")
    PERMANENT_SESSION_LIFETIME = timedelta(days=90)
