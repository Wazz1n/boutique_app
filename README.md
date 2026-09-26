# Boutique Élégance — prototype complet (Flask + React)

## 1. Lancer le backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # sur Windows : venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python seed.py                # crée des données de démo (une seule fois)
python app.py
```

Le serveur tourne sur http://localhost:5000. Le mot de passe de démo est
celui défini dans `backend/.env` (`APP_PASSWORD`).

## 2. Lancer le frontend (React)

Dans un second terminal, à la racine du projet :

```bash
npm install
cp .env.example .env
npm run dev
```

Ouvrir http://localhost:5173, entrer le mot de passe, et voilà.

## Structure

```
backend/
  app.py         routes API (login, dashboard, produits, ventes, backup)
  models.py      modèles SQLAlchemy (Produit, Vente, LigneVente)
  config.py      lecture des variables d'environnement
  seed.py        données de démonstration
  requirements.txt

src/
  api.js               tous les appels au backend, centralisés
  LoginScreen.jsx       écran de connexion par mot de passe unique
  AddSaleForm.jsx        formulaire d'ajout d'une vente
  App.jsx                assemble le dashboard
  components/
    GlassCard.jsx         style "verre dépoli"
    MetricCard.jsx         carte chiffrée
    RevenueChart.jsx       graphique du CA
    RecentSales.jsx        liste des dernières ventes
```

## Pour la suite (pas encore fait)

- Basculer `DATABASE_URL` vers Neon en production
- Déployer le backend sur Render, le build React dessus aussi
- Sauvegarde automatique (téléchargement local + export planifié côté serveur)
- Gestion des produits depuis l'interface (ajout/édition de stock)

## Déploiement en production (Render + Neon)

Le backend Flask sert maintenant directement le frontend une fois compilé —
un seul service à héberger, une seule URL.

1. Créer la base sur [Neon](https://neon.tech) (gratuit, permanent), copier l'URL de connexion.
2. Pousser le projet sur GitHub.
3. Sur [Render](https://render.com), créer un "Web Service" à partir du repo, avec :
   - **Build Command** : `pip install -r backend/requirements.txt && npm install && npm run build`
   - **Start Command** : `cd backend && gunicorn app:app`
   - Variables d'environnement (dans l'onglet "Environment" de Render, pas dans un fichier .env) :
     `SECRET_KEY`, `APP_PASSWORD`, `DATABASE_URL` (l'URL Neon), `FRONTEND_URL` (l'URL Render elle-même une fois connue)
4. Ajouter `gunicorn` à `backend/requirements.txt` (serveur de production, `python app.py` ne sert qu'au développement).

Une fois en ligne, elle ouvre simplement l'URL Render — le mot de passe
protège l'accès, et le bouton "+ Ajouter du stock" sert aussi à entrer
n'importe quel nouveau produit qui arrive en boutique, directement depuis
le site, sans jamais toucher au code ni à une base de données.
