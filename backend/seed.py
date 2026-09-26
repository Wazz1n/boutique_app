"""
Lance ce script une seule fois pour remplir la base avec des produits
et des ventes de démonstration, histoire d'avoir un dashboard qui n'est
pas vide pendant la démo de demain.

Usage : python seed.py
"""

from datetime import datetime, timedelta
import random

from app import create_app
from models import db, Produit, Vente, LigneVente

app = create_app()

with app.app_context():
    if Produit.query.count() > 0:
        print("Des produits existent déjà, on ne réinsère rien.")
    else:
        produits = [
            Produit(nom="Robe fleurie, taille M", categorie="Robes", prix_vente=45000, quantite_stock=8, seuil_alerte=3),
            Produit(nom="Sac à main beige", categorie="Accessoires", prix_vente=62000, quantite_stock=2, seuil_alerte=3),
            Produit(nom="Sandales dorées", categorie="Chaussures", prix_vente=38000, quantite_stock=5, seuil_alerte=3),
            Produit(nom="Chemisier blanc", categorie="Hauts", prix_vente=32000, quantite_stock=1, seuil_alerte=3),
        ]
        db.session.add_all(produits)
        db.session.commit()

        # Quelques ventes réparties sur les 30 derniers jours
        for i in range(15):
            produit = random.choice(produits)
            quantite = random.randint(1, 2)
            vente = Vente(
                date_vente=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                total=produit.prix_vente * quantite,
            )
            vente.lignes.append(
                LigneVente(produit_id=produit.id, quantite=quantite, prix_unitaire=produit.prix_vente)
            )
            db.session.add(vente)

        db.session.commit()
        print("Données de démo créées.")
