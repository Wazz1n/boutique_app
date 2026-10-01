from functools import wraps
from datetime import datetime
import csv
import io
import os

from flask import Flask, request, jsonify, session, send_file, send_from_directory
from flask_cors import CORS
from sqlalchemy import func, extract

from config import Config
from models import db, Produit, Vente, LigneVente, MouvementStock

# Dossier où atterrit "npm run build" (le frontend compilé en fichiers statiques).
# En développement ce dossier n'existe pas encore, donc on ne le sert que s'il est là.
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "dist")


def create_app():
    app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path="")
    app.config.from_object(Config)

    db.init_app(app)

    # supports_credentials=True est nécessaire pour que le cookie de session
    # (créé par /api/login) soit bien envoyé par le navigateur à chaque requête suivante.
    CORS(app, supports_credentials=True, origins=[app.config["FRONTEND_URL"]])

    with app.app_context():
        db.create_all()

    register_routes(app)
    register_frontend(app)
    return app


# --- Protection par mot de passe unique -------------------------------------
# Pas de table Utilisateur, pas de rôles : un seul mot de passe partagé,
# vérifié une fois, puis gardé en session pendant 90 jours (voir PERMANENT_SESSION_LIFETIME).

def connexion_requise(fonction):
    @wraps(fonction)
    def decoree(*args, **kwargs):
        if not session.get("connecte"):
            return jsonify({"erreur": "Connexion requise"}), 401
        return fonction(*args, **kwargs)

    return decoree


def register_routes(app):

    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json(silent=True) or {}
        mot_de_passe = data.get("motDePasse", "")

        if mot_de_passe != app.config["APP_PASSWORD"]:
            return jsonify({"erreur": "Mot de passe incorrect"}), 401

        session.permanent = True
        session["connecte"] = True
        return jsonify({"ok": True})

    @app.route("/api/logout", methods=["POST"])
    def logout():
        session.clear()
        return jsonify({"ok": True})

    @app.route("/api/session", methods=["GET"])
    def verifier_session():
        return jsonify({"connecte": bool(session.get("connecte"))})

    # --- Dashboard -----------------------------------------------------------

    @app.route("/api/dashboard", methods=["GET"])
    @connexion_requise
    def dashboard():
        maintenant = datetime.utcnow()
        mois_actuel, annee_actuelle = maintenant.month, maintenant.year
        mois_prec = mois_actuel - 1 if mois_actuel > 1 else 12
        annee_prec = annee_actuelle if mois_actuel > 1 else annee_actuelle - 1

        ca_actuel = calculer_ca(mois_actuel, annee_actuelle)
        ca_precedent = calculer_ca(mois_prec, annee_prec)

        nb_ventes = (
            db.session.query(func.count(Vente.id))
            .filter(
                extract("month", Vente.date_vente) == mois_actuel,
                extract("year", Vente.date_vente) == annee_actuelle,
            )
            .scalar()
            or 0
        )

        produits_en_alerte = Produit.query.filter(
            Produit.quantite_stock <= Produit.seuil_alerte
        ).all()

        # Historique des 6 derniers mois pour le graphique
        historique = []
        m, a = mois_actuel, annee_actuelle
        for _ in range(6):
            historique.insert(0, {"mois": f"{m:02d}/{a}", "valeur": calculer_ca(m, a)})
            if m == 1:
                m, a = 12, a - 1
            else:
                m -= 1

        return jsonify(
            {
                "chiffreAffaires": ca_actuel,
                "chiffreAffairesMoisDernier": ca_precedent,
                "nombreVentes": nb_ventes,
                # On renvoie la liste des produits concernés (nom + stock restant),
                # pas juste un chiffre — plus utile pour savoir quoi commander.
                "produitsStockFaible": [
                    {"id": p.id, "nom": p.nom, "quantiteStock": p.quantite_stock}
                    for p in produits_en_alerte
                ],
                "historiqueCA": historique,
            }
        )

    # --- Produits --------------------------------------------------------

    @app.route("/api/produits", methods=["GET"])
    @connexion_requise
    def liste_produits():
        produits = Produit.query.order_by(Produit.nom).all()
        return jsonify([p.to_dict() for p in produits])

    @app.route("/api/produits", methods=["POST"])
    @connexion_requise
    def creer_produit():
        data = request.get_json(silent=True) or {}
        nom = (data.get("nom") or "").strip()
        prix_vente = data.get("prixVente")

        if not nom or prix_vente is None:
            return jsonify({"erreur": "Le nom et le prix de vente sont obligatoires"}), 400

        produit = Produit(
            nom=nom,
            categorie=data.get("categorie"),
            prix_vente=float(prix_vente),
            quantite_stock=int(data.get("quantiteStock", 0)),
            seuil_alerte=int(data.get("seuilAlerte", 5)),
        )
        db.session.add(produit)
        db.session.flush()  # pour obtenir produit.id avant le commit

        if produit.quantite_stock > 0:
            db.session.add(
                MouvementStock(
                    produit_id=produit.id,
                    produit_nom=produit.nom,
                    type="nouveau_produit",
                    quantite=produit.quantite_stock,
                )
            )

        db.session.commit()
        return jsonify(produit.to_dict()), 201

    @app.route("/api/produits/<int:produit_id>/stock", methods=["POST"])
    @connexion_requise
    def ajouter_stock(produit_id):
        """Ajoute une quantité au stock existant d'un produit (réapprovisionnement)."""
        data = request.get_json(silent=True) or {}
        quantite = data.get("quantite")

        produit = Produit.query.get(produit_id)
        if not produit:
            return jsonify({"erreur": "Produit introuvable"}), 404
        if not quantite or int(quantite) <= 0:
            return jsonify({"erreur": "Quantité invalide"}), 400

        produit.quantite_stock += int(quantite)
        db.session.add(
            MouvementStock(
                produit_id=produit.id,
                produit_nom=produit.nom,
                type="reapprovisionnement",
                quantite=int(quantite),
            )
        )
        db.session.commit()
        return jsonify(produit.to_dict())

    @app.route("/api/produits/<int:produit_id>", methods=["DELETE"])
    @connexion_requise
    def supprimer_produit(produit_id):
        """
        Supprime un produit du catalogue (ex: arrivage ponctuel terminé, plus jamais
        réapprovisionné). L'historique des ventes déjà faites reste intact — seul le
        produit disparaît de la liste "Stock".

        Important : contrairement à SQLite (utilisé en dev local), PostgreSQL/Neon
        applique STRICTEMENT les contraintes de clé étrangère. On détache donc
        explicitement les références (LigneVente, MouvementStock) avant de supprimer
        le produit, sinon la suppression échoue avec une erreur 500 en production.
        """
        produit = Produit.query.get(produit_id)
        if not produit:
            return jsonify({"erreur": "Produit introuvable"}), 404

        # Détache la référence des lignes de vente passées, sans les supprimer :
        # le nom déjà figé (produit_nom) reste affiché, seul le lien disparaît.
        LigneVente.query.filter_by(produit_id=produit.id).update({"produit_id": None})
        MouvementStock.query.filter_by(produit_id=produit.id).update({"produit_id": None})

        db.session.delete(produit)
        db.session.commit()
        return jsonify({"ok": True})

    # --- Historique du stock -------------------------------------------------

    @app.route("/api/mouvements", methods=["GET"])
    @connexion_requise
    def historique_stock():
        """Historique complet : ventes, réapprovisionnements, créations de produit."""
        mouvements = MouvementStock.query.order_by(MouvementStock.date_mouvement.desc()).limit(100).all()
        return jsonify([m.to_dict() for m in mouvements])

    @app.route("/api/mouvements/<int:mouvement_id>/annuler", methods=["POST"])
    @connexion_requise
    def annuler_mouvement(mouvement_id):
        """
        Annule un mouvement de stock APRÈS coup (erreur de saisie repérée trop tard).
        - Une vente ne s'annule pas ici : on utilise DELETE /api/ventes/<id> à la place,
          qui annule tous les mouvements liés à cette vente en une fois.
        - Un réapprovisionnement : on retire la quantité ajoutée par erreur.
        - Un nouveau produit : on supprime le produit créé par erreur (uniquement s'il
          n'a encore aucune vente enregistrée, pour ne jamais casser un historique existant).
        """
        mouvement = MouvementStock.query.get(mouvement_id)
        if not mouvement:
            return jsonify({"erreur": "Mouvement introuvable"}), 404
        if mouvement.annule:
            return jsonify({"erreur": "Ce mouvement est déjà annulé"}), 400
        if mouvement.type == "vente":
            return jsonify({"erreur": "Annulez la vente entière depuis l'historique des ventes"}), 400

        produit = mouvement.produit
        if not produit:
            return jsonify({"erreur": "Produit introuvable"}), 404

        if mouvement.type == "reapprovisionnement":
            if produit.quantite_stock < mouvement.quantite:
                return jsonify({"erreur": "Stock déjà utilisé depuis, annulation impossible"}), 400
            produit.quantite_stock -= mouvement.quantite
            mouvement.annule = True
            db.session.commit()
            return jsonify({"ok": True})

        if mouvement.type == "nouveau_produit":
            ventes_existantes = LigneVente.query.filter_by(produit_id=produit.id).count()
            if ventes_existantes > 0:
                return jsonify({"erreur": "Des ventes existent déjà pour ce produit, annulation impossible"}), 400
            # Détache toute autre référence restante avant de supprimer le produit
            # (sécurité supplémentaire, même si en principe il n'y en a pas encore ici).
            MouvementStock.query.filter(
                MouvementStock.produit_id == produit.id, MouvementStock.id != mouvement.id
            ).update({"produit_id": None})
            db.session.delete(mouvement)
            db.session.delete(produit)
            db.session.commit()
            return jsonify({"ok": True})

        return jsonify({"erreur": "Type de mouvement inconnu"}), 400

    # --- Ventes ------------------------------------------------------------

    @app.route("/api/ventes", methods=["GET"])
    @connexion_requise
    def liste_ventes():
        ventes = Vente.query.order_by(Vente.date_vente.desc()).limit(20).all()
        return jsonify([v.to_dict() for v in ventes])

    @app.route("/api/ventes", methods=["POST"])
    @connexion_requise
    def creer_vente():
        data = request.get_json(silent=True) or {}
        lignes_demandees = data.get("lignes", [])  # [{produitId, quantite}, ...]

        if not lignes_demandees:
            return jsonify({"erreur": "Ajoutez au moins un article"}), 400

        vente = Vente(total=0)
        total = 0

        for ligne in lignes_demandees:
            produit = Produit.query.get(ligne.get("produitId"))
            quantite = int(ligne.get("quantite", 0))

            if not produit or quantite <= 0:
                return jsonify({"erreur": "Article invalide"}), 400
            if produit.quantite_stock < quantite:
                return jsonify({"erreur": f"Stock insuffisant pour {produit.nom}"}), 400

            produit.quantite_stock -= quantite
            sous_total = produit.prix_vente * quantite
            total += sous_total

            vente.lignes.append(
                LigneVente(
                    produit_id=produit.id,
                    produit_nom=produit.nom,
                    quantite=quantite,
                    prix_unitaire=produit.prix_vente,
                )
            )

        vente.total = total
        db.session.add(vente)
        db.session.flush()  # pour obtenir vente.id avant de créer les mouvements liés

        for ligne in vente.lignes:
            db.session.add(
                MouvementStock(
                    produit_id=ligne.produit_id,
                    produit_nom=ligne.produit_nom,
                    vente_id=vente.id,
                    type="vente",
                    quantite=ligne.quantite,
                )
            )

        db.session.commit()
        return jsonify(vente.to_dict()), 201

    @app.route("/api/ventes/<int:vente_id>", methods=["DELETE"])
    @connexion_requise
    def annuler_vente(vente_id):
        """
        Annule une vente déjà enregistrée : remet le stock, marque les mouvements
        liés comme annulés, puis supprime la vente.

        Comme pour supprimer_produit : PostgreSQL refuse de supprimer une ligne
        tant qu'une autre table pointe encore dessus. On détache donc vente_id
        des mouvements AVANT de supprimer la vente, sinon 500 en production.
        """
        vente = Vente.query.get(vente_id)
        if not vente:
            return jsonify({"erreur": "Vente introuvable"}), 404

        for ligne in vente.lignes:
            if ligne.produit:
                ligne.produit.quantite_stock += ligne.quantite

        MouvementStock.query.filter_by(vente_id=vente.id).update(
            {"annule": True, "vente_id": None}
        )
        db.session.delete(vente)  # supprime aussi les lignes (cascade)
        db.session.commit()
        return jsonify({"ok": True})

    # --- Sauvegarde CSV ------------------------------------------------------

    @app.route("/api/backup", methods=["GET"])
    @connexion_requise
    def backup():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["date_vente", "produit", "quantite", "prix_unitaire", "total_ligne"])

        for vente in Vente.query.order_by(Vente.date_vente).all():
            for ligne in vente.lignes:
                writer.writerow(
                    [
                        vente.date_vente.isoformat(),
                        ligne.produit.nom if ligne.produit else "",
                        ligne.quantite,
                        ligne.prix_unitaire,
                        ligne.quantite * ligne.prix_unitaire,
                    ]
                )

        buffer.seek(0)
        return send_file(
            io.BytesIO(buffer.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"backup_{datetime.utcnow().date()}.csv",
        )


def calculer_ca(mois, annee):
    total = (
        db.session.query(func.sum(Vente.total))
        .filter(
            extract("month", Vente.date_vente) == mois,
            extract("year", Vente.date_vente) == annee,
        )
        .scalar()
    )
    return round(total or 0, 2)


def register_frontend(app):
    """
    Sert le frontend React déjà compilé (dossier dist/), pour n'avoir qu'un
    seul service à déployer sur Render au lieu de deux séparés.
    Tant que dist/ n'existe pas (en développement, avant 'npm run build'),
    ces routes ne servent à rien de concret : on utilise `npm run dev` à la place.
    """

    @app.route("/", defaults={"chemin": ""})
    @app.route("/<path:chemin>")
    def servir_frontend(chemin):
        fichier_demande = os.path.join(app.static_folder, chemin)
        if chemin and os.path.exists(fichier_demande):
            return send_from_directory(app.static_folder, chemin)
        # Pour toute autre URL (ex: rafraîchir la page sur une route React),
        # on renvoie index.html et c'est React qui gère l'affichage côté client.
        return send_from_directory(app.static_folder, "index.html")


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
