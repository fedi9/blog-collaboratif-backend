const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true }, // Nom d'utilisateur
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Pour les réponses
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Pour les likes
    isEdited: { type: Boolean, default: false }, // Statut d'édition
    editedAt: { type: Date }, // Date d'édition
    isDeleted: { type: Boolean, default: false } // Suppression douce
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index pour les performances
commentSchema.index({ article: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ author: 1 });

// Virtual pour le nombre de réponses
commentSchema.virtual('replyCount').get(function() {
    return this.replies ? this.replies.length : 0;
});

// Virtual pour le nombre de likes
commentSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

module.exports = mongoose.model('Comment', commentSchema);
