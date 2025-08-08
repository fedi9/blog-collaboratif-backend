const jwt = require('jsonwebtoken');
require('dotenv').config();

// Données de test pour le token
const testUser = {
    id: '6892c3a85d16edd9433fb8c5',
    username: 'iyed',
    email: 'iyed@example.com',
    role: 'Redacteur'
};

// Générer un token valide pour 1 heure
const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });

console.log('🔑 Token de test généré:');
console.log(token);
console.log('\n📋 Données du token:');
console.log(JSON.stringify(testUser, null, 2)); 