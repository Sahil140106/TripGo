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
                    reject(new Error(`Failed to parse response (Status ${res.statusCode}): ${e.message}`));
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timed out - the data volume is likely too large!'));
        });
    });
};

(async () => {
    try {
        console.log("--- TripGo PRODUCTION Surgical Probe ---");

        // 1. Try to get just the COUNT by using a hack (if possible) or just seeing how long it takes
        console.log("\n[1] Checking Cars count...");
        const startTime = Date.now();
        const cars = await request(`${API_BASE_URL}/cars`);
        const duration = (Date.now() - startTime) / 1000;
        
        console.log(`Found ${cars.length} cars.`);
        console.log(`Fetch took ${duration.toFixed(2)} seconds.`);

        if (cars.length > 0) {
            const firstCar = cars[0];
            const imgSize = firstCar.imageUrl ? firstCar.imageUrl.length : 0;
            console.log(`Car 1 Image Size: ${Math.round(imgSize / 1024)} KB`);
            
            let totalLarge = 0;
            cars.forEach(c => {
                if (c.imageUrl && c.imageUrl.length > 100 * 1024) totalLarge++;
            });
            console.log(`Cars with very large images (>100KB): ${totalLarge}`);
        }

        console.log("\n[2] Checking Handovers...");
        const handovers = await request(`${API_BASE_URL}/handovers`);
        console.log(`Found ${handovers.length} handovers.`);

        console.log("\n[3] Checking Admins...");
        const admins = await request(`${API_BASE_URL}/auth/management-list`);
        console.log(`Found ${admins.length} admins.`);

    } catch (error) {
        console.error("❌ Probe failed:", error.message);
        console.log("SUGGESTION: If this timed out, the database is definitely overloaded with large blobs.");
    }
})();
