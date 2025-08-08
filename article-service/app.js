const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const articleRoutes = require('./routes/articleRoutes');
const commentRoutes = require('./routes/commentRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

/* commenté pour le test */

// Rate Limiting - Configuration pour la production
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 200, // 200 requêtes par minute
//   message: 'Trop de requêtes depuis cette IP, réessayez dans 1 minute.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   // Skip rate limiting for certain paths (optionnel)
//   skip: (req) => {
//     // Skip rate limiting for health checks or specific test endpoints
//     return req.path === '/health' || req.path === '/api/articles/test';
//   }
// });

// // Appliquer le rate limiting
// app.use(limiter);
// console.log('✅ Rate limiting activé: 60 requêtes par minute');

/* commenté  pour le test */


// Routes
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/push-notifications', pushNotificationRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
    res.send('Article Service API 🚀');
});

module.exports = app;
