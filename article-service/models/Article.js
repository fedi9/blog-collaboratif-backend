const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { type: String },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likeCount: { type: Number, default: 0 }, // Compteur de likes
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // IDs des utilisateurs qui ont liké
}, { timestamps: true });

// Index pour optimiser les recherches par titre et contenu
articleSchema.index({ title: 'text', content: 'text' });

// Index normal pour recherche rapide par tags
articleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', articleSchema);
