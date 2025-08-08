const ArticleStats = require('../models/ArticleStats');
const Article = require('../models/Article');

// Obtenir les statistiques de likes d'un article spécifique
exports.getArticleStats = async (req, res) => {
    try {
        const { articleId } = req.params;
        const { period = 'daily', limit = 30 } = req.query;

        let stats = await ArticleStats.findOne({ article: articleId });
        
        if (!stats) {
            // Créer un nouvel stats si il n'existe pas
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

        // Vérifier que l'utilisateur est Admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès refusé. Admin requis.' 
            });
        }

        // Nettoyer les statistiques orphelines avant de récupérer les données
        await cleanOrphanedStats();

        // Récupérer tous les stats avec les articles populés
        const allStats = await ArticleStats.find()
            .populate('article', 'title author createdAt')
            .sort({ totalLikes: -1 });

        // Filtrer les stats pour ne garder que les articles qui existent encore
        const validStats = allStats.filter(stats => {
            return stats.article && stats.article.title; // Vérifier que l'article existe et a un titre
        });

        // Calculer les totaux globaux (seulement pour les articles valides)
        const globalTotals = validStats.reduce((totals, stats) => {
            totals.totalLikes += stats.totalLikes || 0;
            return totals;
        }, { totalLikes: 0 });

        // Récupérer les articles les plus likés (seulement les articles valides)
        const topLikedArticles = validStats
            .sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0))
            .slice(0, 10)
            .map(item => ({
                article: item.article,
                stats: {
                    totalLikes: item.totalLikes
                }
            }));

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

// Fonction utilitaire pour nettoyer les statistiques orphelines
async function cleanOrphanedStats() {
    try {
        // Récupérer tous les ArticleStats
        const allStats = await ArticleStats.find();
        let deletedCount = 0;

        for (const stats of allStats) {
            // Vérifier si l'article existe encore
            const article = await Article.findById(stats.article);
            if (!article) {
                // L'article n'existe plus, supprimer les statistiques
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
        // Vérifier que l'utilisateur est Admin
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