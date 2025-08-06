const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔹 Vérifie si l'utilisateur est connecté
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contient id et role
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// 🔹 Vérifie si l'utilisateur a un rôle spécifique
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};
