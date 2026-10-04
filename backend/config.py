import os
from datetime import timedelta
from dotenv import load_dotenv

# Charge les variables du fichier .env dans os.environ
load_dotenv()


def _normaliser_url_bdd(url):
    # Neon (et d'autres hébergeurs Postgres) fournissent une URL qui commence
    # par "postgres://" ou "postgresql://" sans préciser le pilote Python à
    # utiliser. On force explicitement "psycopg" (version 3, wheels dispo
    # même sur les Python très récents comme celui de Render) plutôt que de
    # laisser SQLAlchemy deviner — c'est cette ambiguïté qui causait l'erreur
    # "No module named 'psycopg'" au déploiement.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-a-changer")
    SQLALCHEMY_DATABASE_URI = _normaliser_url_bdd(
        os.environ.get("DATABASE_URL", "sqlite:///boutique.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    APP_PASSWORD = os.environ.get("APP_PASSWORD", "motdepasse123")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    # Une fois connectée, elle reste connectée 90 jours (cf. discussion "pas besoin de retaper le mot de passe")
    PERMANENT_SESSION_LIFETIME = timedelta(days=90)
