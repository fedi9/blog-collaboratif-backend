const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/authMiddleware');
const User = require('../models/User');

const router = express.Router();

/**
 * 📌 GET /api/users/all
 * Query params :
 *  - search : mot-clé pour chercher dans username et email
 *  - role : filtrer par rôle spécifique
 *  - page : numéro de page (par défaut 1)
 *  - limit : nombre d'utilisateurs par page (par défaut 10)
 */
router.get('/all', verifyToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const filter = {};
    
    // Recherche dans username et email
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtre par rôle
    if (role) {
      filter.role = role;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      users
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * 📌 PUT /api/users/:id/role
 * Permet à l'admin de modifier le rôle d'un utilisateur
 */
router.put('/:id/role', verifyToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    // Vérifier que le rôle est valide
    const validRoles = ['Admin', 'Editeur', 'Redacteur', 'Lecteur'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Rôle invalide. Rôles autorisés : Admin, Editeur, Redacteur, Lecteur' 
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher l'admin de se modifier lui-même
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ 
        message: 'Vous ne pouvez pas modifier votre propre rôle' 
      });
    }

    // Mettre à jour le rôle
    user.role = role;
    await user.save();

    // Retourner l'utilisateur mis à jour (sans le mot de passe)
    const updatedUser = await User.findById(id).select('-password');
    
    res.json({
      message: `Rôle de ${user.username} modifié avec succès`,
      user: updatedUser
    });
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