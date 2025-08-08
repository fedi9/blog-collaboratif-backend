const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { roles } = require('../models/User');

const router = express.Router();

// 🔹 Génération d'un JWT
function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id, 
      username: user.username,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// 🔹 Génération d'un refresh token
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// 📌 Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (role && !roles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📌 Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

    console.log('User found:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log('Generated token payload:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });

    res.json({ token, refreshToken, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
