# Blog Collaboratif Backend (MEAN Stack - Backend)

## 📌 Description
Backend d'une plateforme de **blog collaboratif multi-auteurs** développée en **Node.js + Express + MongoDB**.  
Ce backend fait partie d'un test technique visant à mettre en place une architecture **scalable, sécurisée et performante**.

---

## 🚀 Étape actuelle du développement
Dans cette première étape, nous avons :

1. **Initialisé le projet Node.js**
   - `npm init -y`
   - Installation des dépendances : `express`, `mongoose`, `dotenv`, `cors`, `bcrypt`, `jsonwebtoken`, `morgan`, `express-rate-limit`
   - Installation de `nodemon` pour le développement

2. **Créé la structure de base**
blog-collaboratif-backend/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── .env
├── app.js
├── server.js
└── package.json


3. **Configuré l'environnement**
- Fichier `.env` pour stocker `PORT`, `MONGO_URI`, `JWT_SECRET`, `REFRESH_SECRET`
- Middleware `morgan` pour les logs
- `cors` pour autoriser les requêtes cross-origin
- **Rate Limiting** avec `express-rate-limit` pour limiter les requêtes et éviter les attaques DDoS

4. **Connexion à MongoDB**
- Mise en place d’une connexion avec Mongoose
- Résolution des problèmes liés à la version de MongoDB (mise à jour vers MongoDB 7)

5. **Authentification et sécurité**
- Modèle `User` avec hashage du mot de passe via **bcrypt**
- Routes `register` et `login` avec génération de **JWT Access Token** et **Refresh Token**
- Middleware `verifyToken` pour protéger les routes
- Middleware `authorizeRoles` pour la gestion des permissions (Admin, Éditeur, Rédacteur, Lecteur)

# User Service - Blog Collaboratif (Microservice)

## 📌 Microservices
Le **User Service** est un microservice indépendant qui gère :
- L'authentification des utilisateurs
- L'inscription
- La connexion avec **JWT Access Token** et **Refresh Token**
- La gestion des rôles (Admin, Éditeur, Rédacteur, Lecteur)
- Les routes sécurisées par middleware d'autorisation
- La sécurité avec **bcrypt** (hashage des mots de passe), **CORS** et **Rate Limiting**

Ce microservice fonctionne de manière autonome et expose ses propres routes API sur un port dédié (**5001** par défaut).

6. **Mise en ligne sur GitHub**
- Création d'un dépôt GitHub : [https://github.com/fedi9/blog-collaboratif-backend](https://github.com/fedi9/blog-collaboratif-backend)
- Configuration du `.gitignore`
- Premier commit et push

## 🔐 Schéma du fonctionnement Auth + Rôles

```plaintext
[ Client Angular ]
    |
    | 1. Login (email + mot de passe)
    v
[ API /api/auth/login ]
    |
    |-- Vérifie email & mot de passe
    |-- Génère JWT (15 min) + Refresh Token (7 jours)
    v
[ Réponse avec JWT + Refresh Token ]
    |
    | 2. Appel d'une route protégée
    |   Ex: GET /api/users/all
    v
[ Middleware verifyToken ]
    |
    |-- Vérifie la validité du JWT
    |-- Décode userId et rôle
    v
[ Middleware authorizeRoles('Admin') ]
    |
    |-- Vérifie que l'utilisateur est Admin
    v
[ Contrôleur de la route ]
    |
    |-- Retourne les données

---

## 📦 Installation et exécution

1. **Cloner le dépôt**
```bash
git clone https://github.com/fedi9/blog-collaboratif-backend.git
cd blog-collaboratif-backend

2. **Installer les dépendances**
npm install

3. **Configurer les variables d'environnement**
Créer un fichier .env :

PORT=5000
MONGO_URI=mongodb://localhost:27017/blog-collaboratif
JWT_SECRET=unsecretfort
REFRESH_SECRET=unautresecret

4. **Démarrer le serveur**
npm run dev

📜 Licence
Ce projet est réalisé dans le cadre d'un test technique. Libre pour un usage pédagogique.


