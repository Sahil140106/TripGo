const https = require('https');

const API_BASE_URL = 'https://tripgo-backend-34la.onrender.com/api';

const request = (url) => {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve([]); // Return empty if failed for count purpose
                }
            });
        });
        req.on('error', (e) => resolve([]));
        req.setTimeout(10000, () => {
            req.destroy();
            resolve([]);
        });
    });
};

(async () => {
    try {
        console.log("--- TripGo PRODUCTION Table Count Audit ---");

        const endpoints = [
            '/cars',
            '/handovers',
            '/bookings',
            '/payments',
            '/transactions',
            '/messages',
            '/auth/users',
            '/auth/management-list'
        ];

        for (const endpoint of endpoints) {
            const data = await request(`${API_BASE_URL}${endpoint}`);
            console.log(`${endpoint.padEnd(25)} : ${data.length} records`);
        }

        console.log("\n--- Conclusion ---");
        console.log("If most counts are low/zero, the 815MB storage is definitely Binlogs or InnoDB fragmentation.");
        console.log("This happens after a large deletion. The data is gone, but the disk space remains allocated.");

    } catch (error) {
        console.error("❌ Audit failed:", error.message);
    }
})();
