const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true }, 
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], 
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    isEdited: { type: Boolean, default: false }, 
    editedAt: { type: Date }, 
    isDeleted: { type: Boolean, default: false } 
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
