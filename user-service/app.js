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

// Rate limiting - Configuration pour la production
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 60 requêtes par minute
    message: 'Trop de requêtes depuis cette IP, réessayez dans 1 minute.',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for certain paths (optionnel)
    skip: (req) => {
        // Skip rate limiting for health checks or specific test endpoints
        return req.path === '/health' || req.path === '/api/auth/test';
    }
});

// Appliquer le rate limiting
app.use(limiter);
console.log('✅ Rate limiting activé: 60 requêtes par minute');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('User Service API 🚀');
});

module.exports = app;
