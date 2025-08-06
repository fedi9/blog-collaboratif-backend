const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const articleRoutes = require('./routes/articleRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use(limiter);

// Routes
app.use('/api/articles', articleRoutes);
app.use('/api/comments', commentRoutes);

app.get('/', (req, res) => {
    res.send('Article Service API 🚀');
});

module.exports = app;
