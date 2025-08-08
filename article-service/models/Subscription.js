const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    endpoint: { 
        type: String, 
        required: true 
    },
    keys: {
        p256dh: { 
            type: String, 
            required: true 
        },
        auth: { 
            type: String, 
            required: true 
        }
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    lastUsed: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Index pour les performances
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ endpoint: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema); 