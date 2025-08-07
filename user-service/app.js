const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting - Configuration plus permissive pour les tests
// Pour désactiver complètement le rate limiting en développement, décommentez la ligne suivante :
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });

// Configuration actuelle (plus permissive)
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 1000, // 1000 requêtes par 15 minutes (au lieu de 100)
//     message: 'Trop de requêtes depuis cette IP, réessayez dans 15 minutes.',
//     standardHeaders: true,
//     legacyHeaders: false,
//     // Skip rate limiting for certain paths (optionnel)
//     skip: (req) => {
//         // Skip rate limiting for health checks or specific test endpoints
//         return req.path === '/health' || req.path === '/api/auth/test';
//     }
// });

// Désactiver le rate limiting en mode développement (NODE_ENV=development)
// if (process.env.NODE_ENV === 'development') {
//     console.log('⚠️  Rate limiting désactivé en mode développement');
// } else {
//     app.use(limiter);
// }

// TEMPORAIRE : Rate limiting désactivé pour les tests
console.log('⚠️  Rate limiting temporairement désactivé pour les tests');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('User Service API 🚀');
});

module.exports = app;
