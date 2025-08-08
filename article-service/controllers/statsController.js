const ArticleStats = require('../models/ArticleStats');
const Article = require('../models/Article');
const axios = require('axios');

// Obtenir les statistiques de likes d'un article spécifique
exports.getArticleStats = async (req, res) => {
    try {
        const { articleId } = req.params;
        const { period = 'daily', limit = 30 } = req.query;

        let stats = await ArticleStats.findOne({ article: articleId });
        
        if (!stats) {
            
            stats = new ArticleStats({
                article: articleId,
                totalLikes: 0
            });
            await stats.save();
        }

        let periodStats = [];
        switch (period) {
            case 'daily':
                periodStats = stats.dailyLikes.slice(-parseInt(limit));
                break;
            case 'weekly':
                periodStats = stats.weeklyLikes.slice(-parseInt(limit));
                break;
            case 'monthly':
                periodStats = stats.monthlyLikes.slice(-parseInt(limit));
                break;
            default:
                periodStats = stats.dailyLikes.slice(-30);
        }

        res.json({
            success: true,
            data: {
                totalLikes: stats.totalLikes,
                stats: periodStats,
                period: period
            }
        });

    } catch (error) {
        console.error('Error getting article stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des statistiques' 
        });
    }
};

// Obtenir les statistiques globales de likes (pour Admin)
exports.getGlobalStats = async (req, res) => {
    try {
        const { period = 'daily', limit = 30 } = req.query;

        
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès refusé. Admin requis.' 
            });
        }

    
        await cleanOrphanedStats();

    
        const allStats = await ArticleStats.find()
            .populate('article', 'title author createdAt')
            .sort({ totalLikes: -1 });

        // Filtrer les stats pour ne garder que les articles qui existent encore
        const validStats = allStats.filter(stats => {
            return stats.article && stats.article.title; 
        });

        // Calculer les totaux globaux (seulement pour les articles valides)
        const globalTotals = validStats.reduce((totals, stats) => {
            totals.totalLikes += stats.totalLikes || 0;
            return totals;
        }, { totalLikes: 0 });

        
        // Enrichir les articles avec les détails des auteurs
        const topLikedArticles = await Promise.all(
            validStats
                .sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0))
                .slice(0, 10)
                .map(async (item) => {
                    let authorDetails = null;
                    
                    if (item.article && item.article.author) {
                        try {
                            console.log("Appel à UserService pour author dans stats:", item.article.author);
                            const userRes = await axios.get(
                                `http://localhost:5001/api/users/${item.article.author}`,
                                {
                                    headers: {
                                        Authorization: req.headers.authorization
                                    }
                                }
                            );
                            authorDetails = userRes.data;
                        } catch (error) {
                            console.error("Erreur récupération auteur pour stats:", error.message);
                            authorDetails = null;
                        }
                    }
                    
                    return {
                        article: {
                            ...item.article.toObject(),
                            authorDetails: authorDetails
                        },
                        stats: {
                            totalLikes: item.totalLikes
                        }
                    };
                })
        );

        // Calculer les statistiques par période (seulement pour les articles valides)
        let periodStats = [];
        if (period === 'daily') {
            // Agréger les statistiques quotidiennes de tous les articles valides
            const dailyStatsMap = new Map();
            
            validStats.forEach(stats => {
                if (stats.dailyLikes && Array.isArray(stats.dailyLikes)) {
                    stats.dailyLikes.forEach(stat => {
                        const dateKey = stat.date.toISOString().split('T')[0];
                        if (!dailyStatsMap.has(dateKey)) {
                            dailyStatsMap.set(dateKey, {
                                date: dateKey,
                                likes: 0
                            });
                        }
                        const existing = dailyStatsMap.get(dateKey);
                        existing.likes += stat.likes || 0;
                    });
                }
            });
            
            periodStats = Array.from(dailyStatsMap.values())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-parseInt(limit));
        }

        res.json({
            success: true,
            data: {
                globalTotals,
                topLikedArticles,
                periodStats,
                period
            }
        });

    } catch (error) {
        console.error('Error getting global stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des statistiques globaux' 
        });
    }
};


async function cleanOrphanedStats() {
    try {
        
        const allStats = await ArticleStats.find();
        let deletedCount = 0;

        for (const stats of allStats) {
            
            const article = await Article.findById(stats.article);
            if (!article) {
                
                await ArticleStats.findByIdAndDelete(stats._id);
                deletedCount++;
                console.log(`🗑️ Statistiques orphelines supprimées pour l'article ${stats.article}`);
            }
        }

        if (deletedCount > 0) {
            console.log(`✅ ${deletedCount} statistiques orphelines nettoyées`);
        }
        
        return deletedCount;
    } catch (error) {
        console.error('⚠️ Erreur lors du nettoyage des statistiques orphelines:', error.message);
        throw error;
    }
}

// Route pour nettoyer manuellement les statistiques orphelines (Admin seulement)
exports.cleanOrphanedStats = async (req, res) => {
    try {
        
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès refusé. Admin requis.' 
            });
        }

        const deletedCount = await cleanOrphanedStats();
        
        res.json({
            success: true,
            message: `${deletedCount} statistiques orphelines ont été nettoyées`,
            deletedCount
        });

    } catch (error) {
        console.error('Error cleaning orphaned stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du nettoyage des statistiques orphelines' 
        });
    }
}; 