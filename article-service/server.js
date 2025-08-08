const app = require('./app');
const mongoose = require('mongoose');
const http = require('http');
const socketService = require('./services/socketService');
require('dotenv').config();

const PORT = process.env.PORT || 5002;

// Créer un serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.io
socketService.initialize(server);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB (ArticleService)');
        server.listen(PORT, () => {
            console.log(`🚀 Article Service running on http://localhost:${PORT}`);
            console.log(`🔌 Socket.io service is running`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });
