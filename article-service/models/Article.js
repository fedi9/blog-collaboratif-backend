const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Index pour optimiser les recherches par titre et tags
 articleSchema.index({ title: 'text', tags: 'text' });

// // 🔹 Index texte pour recherche par titre
// articleSchema.index({ title: 'text' });

// // 🔹 Index normal pour recherche rapide par tags
// articleSchema.index({ tags: 1 });


module.exports = mongoose.model('Article', articleSchema);
