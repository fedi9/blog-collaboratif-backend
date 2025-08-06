# Blog Collaboratif Backend (MEAN Stack - Backend)

## 📌 Description
Backend d'une plateforme de **blog collaboratif multi-auteurs** développée en **Node.js + Express + MongoDB**.  
Ce backend fait partie d'un test technique visant à mettre en place une architecture **scalable, sécurisée et performante**.

---

## 🚀 Étape actuelle du développement
Dans cette première étape, nous avons :

1. **Initialisé le projet Node.js**
   - `npm init -y`
   - Installation des dépendances : `express`, `mongoose`, `dotenv`, `cors`, `bcrypt`, `jsonwebtoken`, `morgan`
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

markdown
Copy
Edit

3. **Configuré l'environnement**
- Fichier `.env` pour stocker `PORT`, `MONGO_URI`, `JWT_SECRET`, etc.
- Middleware `morgan` pour les logs, `cors` pour gérer les requêtes cross-origin

4. **Connexion à MongoDB**
- Mise en place d’une connexion avec Mongoose
- Résolution des problèmes liés à la version de MongoDB (mise à jour vers MongoDB 7)

5. **Mise en ligne sur GitHub**
- Création d'un dépôt GitHub : [https://github.com/fedi9/blog-collaboratif-backend](https://github.com/fedi9/blog-collaboratif-backend)
- Configuration du `.gitignore`
- Premier commit et push

---

## 📦 Installation et exécution

1. **Cloner le dépôt**
```bash
git clone https://github.com/fedi9/blog-collaboratif-backend.git
cd blog-collaboratif-backend
Installer les dépendances

npm install
Configurer les variables d'environnement
Créer un fichier .env :

env
PORT=5000
MONGO_URI=mongodb://localhost:27017/blog-collaboratif
JWT_SECRET=unsecretfort
REFRESH_SECRET=unautresecret
Démarrer le serveur

npm run dev
📜 Licence
Ce projet est réalisé dans le cadre d'un test technique. Libre pour un usage pédagogique.
