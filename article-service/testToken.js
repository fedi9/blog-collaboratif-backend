const jwt = require('jsonwebtoken');
require('dotenv').config();

// 🔹 Mets ici ton token pour le test
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OTJjM2E4NWQxNmVkZDk0MzNmYjhjNSIsInJvbGUiOiJFZGl0ZXVyIiwiaWF0IjoxNzU0NDQ5NDQ0LCJleHAiOjE3NTQ0NTAzNDR9.a9koOIpN9wtuPms3WUgn2fh0nF675aDwrEBh4yI8zRk";

// Vérification
try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token valide !");
    console.log("Données dans le token :", decoded);
} catch (err) {
    console.error("❌ Token invalide :", err.message);
}
