// const express = require('express');
// const { verifyToken } = require('../middlewares/authMiddleware');

// const router = express.Router();

// // Exemple de route protégée
// router.get('/', verifyToken, (req, res) => {
//     res.json({ message: 'Liste des commentaires' });
// });

// module.exports = router;



// routes/commentRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Liste des commentaires (test)' });
});

module.exports = router;

