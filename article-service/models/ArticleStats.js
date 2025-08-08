const mongoose = require('mongoose');

const articleStatsSchema = new mongoose.Schema({
    article: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Article', 
        required: true 
    },
    totalLikes: { 
        type: Number, 
        default: 0 
    },
    // Statistiques par jour
    dailyLikes: [{
        date: { 
            type: Date, 
            required: true 
        },
        likes: { 
            type: Number, 
            default: 0 
        }
    }],
    // Statistiques par semaine
    weeklyLikes: [{
        week: { 
            type: String, 
            required: true 
        },
        likes: { 
            type: Number, 
            default: 0 
        }
    }],
    // Statistiques par mois
    monthlyLikes: [{
        month: { 
            type: String, 
            required: true 
        },
        likes: { 
            type: Number, 
            default: 0 
        }
    }]
}, {
    timestamps: true
});

// Index pour optimiser les recherches
articleStatsSchema.index({ article: 1 });
articleStatsSchema.index({ 'dailyLikes.date': 1 });
articleStatsSchema.index({ 'weeklyLikes.week': 1 });
articleStatsSchema.index({ 'monthlyLikes.month': 1 });

// Méthode pour incrémenter les likes
articleStatsSchema.methods.incrementLikes = function() {
    this.totalLikes += 1;
    this.updateDailyStats();
    return this.save();
};

// Méthode pour décrémenter les likes
articleStatsSchema.methods.decrementLikes = function() {
    this.totalLikes = Math.max(0, this.totalLikes - 1);
    this.updateDailyStats();
    return this.save();
};

// Méthode pour mettre à jour les statistiques quotidiennes
articleStatsSchema.methods.updateDailyStats = function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyStat = this.dailyLikes.find(stat => 
        stat.date.getTime() === today.getTime()
    );
    
    if (!dailyStat) {
        dailyStat = {
            date: today,
            likes: 0
        };
        this.dailyLikes.push(dailyStat);
    }
    
    // Mettre à jour avec le total actuel
    dailyStat.likes = this.totalLikes;
};

module.exports = mongoose.model('ArticleStats', articleStatsSchema); 