const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const User = require('../models/User');

const router = express.Router();

router.get('/all', verifyToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password'); // on cache le mot de passe
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;