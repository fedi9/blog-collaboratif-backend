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

        // Récupérer tous les stats
        const allStats = await ArticleStats.find()
            .populate('article', 'title author createdAt')
            .sort({ totalLikes: -1 });

        // Calculer les totaux globaux
        const globalTotals = allStats.reduce((totals, stats) => {
            totals.totalLikes += stats.totalLikes || 0;
            return totals;
        }, { totalLikes: 0 });

        // Récupérer les articles les plus likés
        const topLikedArticles = await ArticleStats.find()
            .populate('article', 'title author createdAt')
            .sort({ totalLikes: -1 })
            .limit(10);

        // Calculer les statistiques par période
        let periodStats = [];
        if (period === 'daily') {
            // Agréger les statistiques quotidiennes de tous les articles
            const dailyStatsMap = new Map();
            
            allStats.forEach(stats => {
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
            });
            
            periodStats = Array.from(dailyStatsMap.values())
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-parseInt(limit));
        }

        res.json({
            success: true,
            data: {
                globalTotals,
                topLikedArticles: topLikedArticles.map(item => ({
                    article: item.article,
                    stats: {
                        totalLikes: item.totalLikes
                    }
                })),
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