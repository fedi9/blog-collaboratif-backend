# Blog Collaboratif - Backend

Un backend moderne pour une plateforme de blog collaboratif avec architecture microservices, authentification JWT, notifications push et temps réel.

## 🚀 Installation et Exécution

### Prérequis

- **Node.js** (version 18 ou supérieure)
- **MongoDB** (version 5.0 ou supérieure)
- **npm** ou **yarn**

### Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd blog-collaboratif-backend
   ```

2. **Installer les dépendances du projet principal**
   ```bash
   npm install
   ```

3. **Installer les dépendances des services**
   ```bash
   # Service utilisateur
   cd user-service
   npm install
   
   # Service article
   cd ../article-service
   npm install
   ```

4. **Configuration de l'environnement**
   
   Créer un fichier `.env` dans chaque service avec les variables suivantes :
   
   **user-service/.env :**
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/blog_collaboratif
   JWT_SECRET=votre_secret_jwt_super_securise
   JWT_EXPIRES_IN=24h
   ```
   
   **article-service/.env :**
   ```env
   PORT=5002
   MONGO_URI=mongodb://localhost:27017/blog_collaboratif
   JWT_SECRET=votre_secret_jwt_super_securise
   USER_SERVICE_URL=http://localhost:5001
   VAPID_PUBLIC_KEY=votre_clé_publique_vapid
   VAPID_PRIVATE_KEY=votre_clé_privée_vapid
   ```

### Exécution

#### Étape préalable : Démarrer MongoDB

Avant de lancer les services, vous devez vous assurer que MongoDB est démarré :

```bash
# Démarrer MongoDB (sur Ubuntu/Debian)
sudo systemctl start mongod

# Vérifier le statut de MongoDB
sudo systemctl status mongod

# Pour que MongoDB démarre automatiquement au boot (optionnel)
sudo systemctl enable mongod
```

**Note :** Si MongoDB n'est pas installé, installez-le avec :
```bash
# Sur Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb


#### Exécution séparée des services

```bash
# Terminal 1 - Service utilisateur
cd user-service
npm run dev

# Terminal 2 - Service article
cd article-service
npm run dev
```


### Vérification

- **Service Utilisateur** : http://localhost:5001
- **Service Article** : http://localhost:5002
- **Documentation API** : Disponible via les endpoints de test

## 📁 Structure du Projet

```
blog-collaboratif-backend/
├── package.json                 # Dépendances principales
├── README.md                   # Ce fichier
├── user-service/               # Service de gestion des utilisateurs
│   ├── app.js                 # Configuration Express
│   ├── server.js              # Point d'entrée du serveur
│   ├── package.json           # Dépendances du service
│   ├── middlewares/
│   │   └── authMiddleware.js  # Middleware d'authentification
│   ├── models/
│   │   └── User.js           # Modèle utilisateur MongoDB
│   └── routes/
│       ├── authRoutes.js      # Routes d'authentification
│       └── userRoutes.js      # Routes utilisateur
└── article-service/            # Service de gestion des articles
    ├── app.js                 # Configuration Express
    ├── server.js              # Point d'entrée du serveur
    ├── package.json           # Dépendances du service
    ├── controllers/
    │   ├── articleController.js    # Contrôleur articles
    │   ├── commentController.js    # Contrôleur commentaires
    │   ├── pushNotificationController.js # Contrôleur notifications
    │   └── statsController.js      # Contrôleur statistiques
    ├── middlewares/
    │   └── authMiddleware.js  # Middleware d'authentification
    ├── models/
    │   ├── Article.js         # Modèle article
    │   ├── Comment.js         # Modèle commentaire
    │   ├── ArticleStats.js    # Modèle statistiques
    │   └── Subscription.js    # Modèle abonnements notifications
    ├── routes/
    │   ├── articleRoutes.js   # Routes articles
    │   ├── commentRoutes.js   # Routes commentaires
    │   ├── pushNotificationRoutes.js # Routes notifications
    │   └── statsRoutes.js     # Routes statistiques
    └── services/
        ├── pushNotificationService.js # Service notifications push
        └── socketService.js    # Service WebSocket
```

## 🏗️ Architecture et Choix Techniques

### Architecture Microservices

Le projet suit une architecture microservices avec deux services principaux :

1. **User Service** (Port 5001)
   - Gestion des utilisateurs et authentification
   - Gestion des rôles (Admin, Editeur, Redacteur, Lecteur)
   - Génération et validation des tokens JWT

2. **Article Service** (Port 5002)
   - Gestion des articles et commentaires
   - Système de likes et statistiques
   - Notifications push et WebSocket
   - Communication avec le User Service

### Technologies Utilisées

#### Backend
- **Node.js** : Runtime JavaScript côté serveur
- **Express.js** : Framework web minimaliste et flexible
- **MongoDB** : Base de données NoSQL orientée documents
- **Mongoose** : ODM pour MongoDB avec validation et middleware
- **JWT** : Authentification stateless avec tokens
- **Socket.io** : Communication temps réel
- **Web Push** : Notifications push navigateur

#### Sécurité
- **bcrypt** : Hachage sécurisé des mots de passe
- **express-rate-limit** : Protection contre les attaques DDoS
- **CORS** : Gestion des requêtes cross-origin
- **Validation** : Validation des données avec Mongoose

**⚠️ Note Rate Limiting :** Le rate limiting est actuellement commenté dans `article-service/app.js` pour faciliter le développement. En production, décommentez les lignes 20-37 pour activer la limitation à 200 requêtes par minute par IP.

#### Développement
- **nodemon** : Redémarrage automatique en développement
- **morgan** : Logging des requêtes HTTP
- **dotenv** : Gestion des variables d'environnement

### Modèles de Données

#### User Model
```javascript
{
  username: String (unique, min 3 caractères),
  email: String (unique, format email),
  password: String (haché avec bcrypt),
  role: String (Admin|Editeur|Redacteur|Lecteur),
  timestamps: true
}
```

#### Article Model
```javascript
{
  title: String (requis),
  content: String (requis),
  image: String (optionnel),
  tags: [String],
  author: ObjectId (référence User),
  likeCount: Number (défaut 0),
  likedBy: [ObjectId] (références User),
  timestamps: true
}
```

### Fonctionnalités Principales

#### Authentification et Autorisation
- Inscription et connexion utilisateur
- Gestion des rôles avec permissions
- Tokens JWT avec expiration
- Middleware d'authentification réutilisable

#### Gestion des Articles
- CRUD complet des articles
- Système de tags et recherche
- Système de likes
- Images et contenu riche

#### Commentaires
- Ajout de commentaires
- Hiérarchie des commentaires
- Modération selon les rôles

#### Notifications
- Notifications push navigateur
- Notifications temps réel via WebSocket
- Gestion des abonnements
- Configuration VAPID

#### Statistiques
- Visualisation des articles qui ont plus de likes 
- Visualisation des articles qui ont les plus de likes sur chart.js
- Métriques de performance
- géré  les statistiques sur Dashboard administrateur

### Bonnes Pratiques Implémentées

1. **Séparation des responsabilités** : Chaque service a sa propre base de données et API
2. **Validation des données** : Schémas Mongoose avec validation
3. **Gestion d'erreurs** : Middleware d'erreur centralisé
4. **Logging** : Logs structurés avec Morgan
5. **Rate Limiting** : Protection contre les abus
6. **CORS** : Configuration sécurisée pour le frontend
7. **Variables d'environnement** : Configuration externalisée
8. **Indexation** : Index MongoDB pour les performances

### API Endpoints

#### User Service (Port 5001)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/users/profile` - Profil utilisateur
- `PUT /api/users/profile` - Mise à jour profil

#### Article Service (Port 5002)
- `GET /api/articles` - Liste des articles
- `POST /api/articles` - Créer un article
- `GET /api/articles/:id` - Détails d'un article
- `PUT /api/articles/:id` - Modifier un article
- `DELETE /api/articles/:id` - Supprimer un article
- `POST /api/articles/:id/like` - Liker un article
- `GET /api/comments` - Commentaires d'un article
- `POST /api/comments` - Ajouter un commentaire
- `GET /api/stats` - Statistiques
- `POST /api/push-notifications/subscribe` - S'abonner aux notifications

## 🔧 Configuration Avancée

### Variables d'Environnement

#### User Service
- `PORT` : Port du service (défaut: 5001)
- `MONGO_URI` : URI de connexion MongoDB
- `JWT_SECRET` : Secret pour signer les tokens JWT
- `JWT_EXPIRES_IN` : Durée de validité des tokens

#### Article Service
- `PORT` : Port du service (défaut: 5002)
- `MONGO_URI` : URI de connexion MongoDB
- `JWT_SECRET` : Secret pour signer les tokens JWT
- `USER_SERVICE_URL` : URL du service utilisateur
- `VAPID_PUBLIC_KEY` : Clé publique VAPID pour les notifications
- `VAPID_PRIVATE_KEY` : Clé privée VAPID pour les notifications

### Base de Données

Le projet utilise MongoDB avec les collections suivantes :
- `users` : Utilisateurs et authentification
- `articles` : Articles du blog
- `comments` : Commentaires sur les articles
- `articlestats` : Statistiques des articles
- `subscriptions` : Abonnements aux notifications push

## 🚀 Déploiement

### Production

1. **Variables d'environnement** : Configurer toutes les variables pour la production
2. **Base de données** : Utiliser MongoDB Atlas ou une instance MongoDB sécurisée
3. **Rate Limiting** : ⚠️ **IMPORTANT** - Décommenter le rate limiting dans `article-service/app.js` (lignes 20-37) et `user-service/app.js` (lignes 18-33) pour la protection DDoS
4. **Process Manager** : Utiliser PM2 pour la gestion des processus
5. **Reverse Proxy** : Configurer Nginx ou Apache
6. **SSL/TLS** : Certificats SSL pour HTTPS
7. **Monitoring** : Logs et monitoring applicatif


## 📝 Notes de Développement

- Le projet utilise une architecture modulaire pour faciliter la maintenance
- Les services communiquent via HTTP REST API
- Les notifications temps réel utilisent Socket.io
- Les notifications push utilisent le standard Web Push
- La sécurité est implémentée à plusieurs niveaux (JWT, rate limiting, validation)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request



