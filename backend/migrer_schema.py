"""
Applique directement les changements de structure de base nécessaires
(sans passer par l'interface web de Neon, qui a des soucis en ce moment).

Usage : python migrer_schema.py
Nécessite que backend/.env contienne bien DATABASE_URL (l'URL Neon).
"""

from sqlalchemy import text
from app import create_app
from models import db

COMMANDES = [
    "ALTER TABLE ligne_vente ALTER COLUMN produit_id DROP NOT NULL;",
    "ALTER TABLE ligne_vente ADD COLUMN IF NOT EXISTS produit_nom VARCHAR(120);",
    "ALTER TABLE mouvement_stock ALTER COLUMN produit_id DROP NOT NULL;",
    "ALTER TABLE mouvement_stock ADD COLUMN IF NOT EXISTS produit_nom VARCHAR(120);",
]

app = create_app()

with app.app_context():
    for commande in COMMANDES:
        print(f"Exécution : {commande}")
        db.session.execute(text(commande))
    db.session.commit()
    print("\n✅ Terminé — le schéma est à jour, aucune donnée n'a été touchée.")
