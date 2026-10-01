from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Produit(db.Model):
    __tablename__ = "produit"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(120), nullable=False)
    categorie = db.Column(db.String(80), nullable=True)
    prix_vente = db.Column(db.Float, nullable=False)
    quantite_stock = db.Column(db.Integer, nullable=False, default=0)
    seuil_alerte = db.Column(db.Integer, nullable=False, default=5)

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "categorie": self.categorie,
            "prixVente": self.prix_vente,
            "quantiteStock": self.quantite_stock,
            "seuilAlerte": self.seuil_alerte,
            "stockFaible": self.quantite_stock <= self.seuil_alerte,
        }


class Vente(db.Model):
    __tablename__ = "vente"

    id = db.Column(db.Integer, primary_key=True)
    date_vente = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    total = db.Column(db.Float, nullable=False, default=0)

    lignes = db.relationship("LigneVente", backref="vente", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "dateVente": self.date_vente.isoformat(),
            "total": self.total,
            "lignes": [ligne.to_dict() for ligne in self.lignes],
        }


class LigneVente(db.Model):
    __tablename__ = "ligne_vente"

    id = db.Column(db.Integer, primary_key=True)
    vente_id = db.Column(db.Integer, db.ForeignKey("vente.id"), nullable=False)
    # nullable=True : si le produit est supprimé plus tard, la ligne de vente reste
    # (le CA de la vente ne bouge pas), seule la référence au produit disparaît.
    produit_id = db.Column(db.Integer, db.ForeignKey("produit.id"), nullable=True)
    # Nom du produit figé au moment de la vente — reste correct même si le
    # produit est renommé ou supprimé ensuite (l'historique ne doit jamais changer).
    produit_nom = db.Column(db.String(120), nullable=True)
    quantite = db.Column(db.Integer, nullable=False)
    prix_unitaire = db.Column(db.Float, nullable=False)

    produit = db.relationship("Produit")

    def to_dict(self):
        return {
            "id": self.id,
            "produitId": self.produit_id,
            "produitNom": self.produit_nom or (self.produit.nom if self.produit else None),
            "quantite": self.quantite,
            "prixUnitaire": self.prix_unitaire,
        }


class MouvementStock(db.Model):
    """
    Trace chaque changement de stock : une vente, un réapprovisionnement, ou la
    création d'un nouveau produit. C'est ce qui alimente l'onglet "Historique du
    stock" et permet d'annuler une opération après coup si elle a été faite par erreur.
    """

    __tablename__ = "mouvement_stock"

    id = db.Column(db.Integer, primary_key=True)
    # nullable=True : permet de détacher la référence si le produit est supprimé,
    # sans perdre la ligne d'historique elle-même (le nom reste affiché tel quel).
    produit_id = db.Column(db.Integer, db.ForeignKey("produit.id"), nullable=True)
    produit_nom = db.Column(db.String(120), nullable=True)  # figé au moment du mouvement
    vente_id = db.Column(db.Integer, db.ForeignKey("vente.id"), nullable=True)
    type = db.Column(db.String(30), nullable=False)  # "vente" | "reapprovisionnement" | "nouveau_produit"
    quantite = db.Column(db.Integer, nullable=False)
    date_mouvement = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    annule = db.Column(db.Boolean, nullable=False, default=False)

    produit = db.relationship("Produit")

    def to_dict(self):
        return {
            "id": self.id,
            "produitId": self.produit_id,
            "produitNom": self.produit_nom or (self.produit.nom if self.produit else "(produit supprimé)"),
            "venteId": self.vente_id,
            "type": self.type,
            "quantite": self.quantite,
            "date": self.date_mouvement.isoformat(),
            "annule": self.annule,
        }
