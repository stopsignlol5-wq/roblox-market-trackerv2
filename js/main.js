class MarketTracker {
    constructor() {
        this.chart = null;
        this.currentItems = [];
        this.filters = {
            sort: 'price',
            search: '',
            priceRange: 'all'
        };
        this.initializeUI();
        this.setupAutoUpdates();
        this.setupFilterListeners();
    }

    initializeUI() {
        this.initTheme();
        this.initChart();
        this.loadInitialData();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.add(`${savedTheme}-mode`);
        document.querySelector('.theme-toggle').textContent = 
            savedTheme === 'light' ? '🌙' : '☀️';
    }

    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Market Volume',
                    data: [],
                    borderColor: '#00b2ff',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(0, 178, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    async loadInitialData() {
        try {
            const { items, stats } = await this.fetchData();
            this.updateDisplay(items, stats);
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Failed to load market data');
        }
    }

    async fetchData() {
        const items = await RobloxAPI.getTrendingItems();
        const stats = await RobloxAPI.getMarketStats();
        return { items, stats };
    }

    updateDisplay(items, stats) {
        this.updateMarketStats(stats);
        this.updateChart(stats.priceHistory);
        this.updateItems(items);
    }

    updateMarketStats(stats) {
        document.getElementById('totalVolume').textContent = 
            `R$ ${stats.totalVolume.toLocaleString()}`;
        document.getElementById('activeItems').textContent = 
            stats.activeItems.toLocaleString();
        document.getElementById('avgPrice').textContent = 
            `R$ ${stats.averagePrice.toLocaleString()}`;
    }

    updateChart(priceHistory) {
        this.chart.data.labels = priceHistory.map(entry => entry.date);
        this.chart.data.datasets[0].data = priceHistory.map(entry => entry.volume);
        this.chart.update();
    }

    updateItems(items) {
        const filteredItems = this.filterItems(items);
        const container = document.getElementById('trendingItems');
        
        container.innerHTML = filteredItems.map(item => `
            <div class="col-12 col-md-4 mb-4">
                <div class="card item-card">
                    <div class="card-img-wrapper">
                        <img src="${item.thumbnail}" class="card-img-top" alt="${item.name}">
                        <div class="price-change ${item.priceChange > 0 ? 'price-up' : 'price-down'}">
                            ${item.priceChange > 0 ? '↑' : '↓'} ${Math.abs(item.priceChange)}%
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text">R$ ${item.price.toLocaleString()}</p>
                        <div class="badges">
                            <span class="badge bg-primary">${item.demand}</span>
                            <span class="badge bg-danger">${item.rarity}</span>
                        </div>
                        <div class="update-time">
                            Updated: ${this.getTimeAgo(item.updated)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterItems(items) {
        let filtered = [...items];

        // Apply search filter
        if (this.filters.search) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(this.filters.search.toLowerCase())
            );
        }

        // Apply price range filter
        switch (this.filters.priceRange) {
            case 'under1k':
                filtered = filtered.filter(item => item.price < 1000);
                break;
            case '1k-10k':
                filtered = filtered.filter(item => item.price >= 1000 && item.price < 10000);
                break;
            case '10k-100k':
                filtered = filtered.filter(item => item.price >= 10000 && item.price < 100000);
                break;
            case 'over100k':
                filtered = filtered.filter(item => item.price >= 100000);
                break;
        }

        // Apply sort
        filtered.sort((a, b) => {
            switch (this.filters.sort) {
                case 'price':
                    return b.price - a.price;
                case 'demand':
                    return this.getDemandValue(b.demand) - this.getDemandValue(a.demand);
                case 'rarity':
                    return this.getRarityValue(b.rarity) - this.getRarityValue(a.rarity);
                default:
                    return 0;
            }
        });

        return filtered;
    }

    getDemandValue(demand) {
        const values = { 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };
        return values[demand] || 0;
    }

    getRarityValue(rarity) {
        const values = { 'Common': 1, 'Uncommon': 2, 'Rare': 3, 'Limited': 4 };
        return values[rarity] || 0;
    }

    getTimeAgo(timestamp) {
        const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60,
            second: 1
        };

        for (let [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        return 'Just now';
    }

    setupAutoUpdates() {
        MarketUpdater.subscribe(({ items, stats }) => {
            this.updateDisplay(items, stats);
        });
    }

    setupFilterListeners() {
        document.getElementById('sortFilter').addEventListener('change', (e) => {
            this.filters.sort = e.target.value;
            this.loadInitialData();
        });

        document.getElementById('searchFilter').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.loadInitialData();
        });

        document.getElementById('priceFilter').addEventListener('change', (e) => {
            this.filters.priceRange = e.target.value;
            this.loadInitialData();
        });
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').prepend(alertDiv);
        
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.marketTracker = new MarketTracker();
});

// Theme toggle function
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}
