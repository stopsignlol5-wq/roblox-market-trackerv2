class RobloxAPI {
    static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    static cache = new Map();

    static async fetchWithCache(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }

        const data = await fetchFunction();
        this.cache.set(key, {
            timestamp: Date.now(),
            data: data
        });
        return data;
    }

    static async getTrendingItems() {
        return this.fetchWithCache('trending', async () => {
            try {
                // Simulated data - in real implementation, this would fetch from Roblox API
                return [
                    {
                        id: 1,
                        name: "Golden Dominus",
                        price: 100000,
                        thumbnail: "https://tr.rbxcdn.com/42f5fbf6e9f9ca7435c5c4d9d22fb08c/420/420/Hat/Png",
                        demand: "High",
                        rarity: "Limited",
                        rap: 95000,
                        priceChange: 5.2,
                        volume: 12,
                        updated: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: "Valkyrie Helm",
                        price: 50000,
                        thumbnail: "https://tr.rbxcdn.com/5a1e2f5b96fcc3ef853886b158f23432/420/420/Hat/Png",
                        demand: "Medium",
                        rarity: "Limited",
                        rap: 48000,
                        priceChange: -2.1,
                        volume: 8,
                        updated: new Date().toISOString()
                    },
                    {
                        id: 3,
                        name: "Sparkle Time Fedora",
                        price: 75000,
                        thumbnail: "https://tr.rbxcdn.com/5751c5b3511955861c7a313c1c6e7164/420/420/Hat/Png",
                        demand: "High",
                        rarity: "Limited",
                        rap: 72000,
                        priceChange: 1.8,
                        volume: 15,
                        updated: new Date().toISOString()
                    }
                ];
            } catch (error) {
                console.error('Error fetching trending items:', error);
                return [];
            }
        });
    }

    static async getMarketStats() {
        return this.fetchWithCache('market-stats', async () => {
            // Simulated market statistics
            return {
                totalVolume: 1250000,
                activeItems: 156,
                averagePrice: 65000,
                priceHistory: [
                    { date: '2025-10-20', volume: 1000000 },
                    { date: '2025-10-21', volume: 1100000 },
                    { date: '2025-10-22', volume: 1150000 },
                    { date: '2025-10-23', volume: 1200000 },
                    { date: '2025-10-24', volume: 1180000 },
                    { date: '2025-10-25', volume: 1220000 },
                    { date: '2025-10-26', volume: 1250000 }
                ]
            };
        });
    }
}

// Auto-update system
class MarketUpdater {
    static updateInterval = 5 * 60 * 1000; // 5 minutes
    static listeners = new Set();

    static start() {
        this.update();
        setInterval(() => this.update(), this.updateInterval);
    }

    static async update() {
        const [items, stats] = await Promise.all([
            RobloxAPI.getTrendingItems(),
            RobloxAPI.getMarketStats()
        ]);
        this.notifyListeners({ items, stats });
    }

    static subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    static notifyListeners(data) {
        this.listeners.forEach(callback => callback(data));
    }
}

// Start the auto-updater
MarketUpdater.start();
