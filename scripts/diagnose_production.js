const https = require('https');

const API_BASE_URL = 'https://tripgo-backend-34la.onrender.com/api';

const request = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse response from ${url}: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
};

(async () => {
    try {
        console.log("--- TripGo PRODUCTION Storage Diagnosis ---");
        console.log(`Connecting to: ${API_BASE_URL}`);

        const entities = [
            { name: 'Cars', path: '/cars' },
            { name: 'Handovers', path: '/handovers' },
            { name: 'Admins', path: '/auth/management-list' },
            { name: 'Bookings', path: '/bookings' }
        ];

        let totalEstimatedSize = 0;

        for (const entity of entities) {
            console.log(`\nChecking ${entity.name}...`);
            const data = await request(`${API_BASE_URL}${entity.path}`);
            console.log(`Count: ${data.length}`);

            let entitySize = 0;
            let largeCount = 0;

            data.forEach(item => {
                // Check all fields for large strings (likely Base64 images)
                Object.values(item).forEach(val => {
                    if (typeof val === 'string' && val.length > 1000) {
                        entitySize += val.length;
                        if (val.length > 50000) largeCount++;
                    }
                });
            });

            const sizeKB = Math.round(entitySize / 1024);
            console.log(`Estimated Image/Blob Size: ${sizeKB} KB`);
            console.log(`Items with large blobs (>50KB): ${largeCount}`);
            
            totalEstimatedSize += entitySize;
        }

        console.log("\n--- OVERALL SUMMARY ---");
        console.log(`Total Estimated Application Data Size: ${Math.round(totalEstimatedSize / 1024)} KB (${(totalEstimatedSize / (1024 * 1024)).toFixed(2)} MB)`);
        console.log("\nNote: This is the size of the data fetched over API.");
        console.log("Aiven storage usage (815MB) includes logs, indices, and database overhead.");
        
        if (totalEstimatedSize / (1024 * 1024) > 100) {
            console.log("⚠️ LARGE DATA DETECTED. Cleanup is highly recommended.");
        } else {
            console.log("✅ API data size seems low. If Aiven is still high, it might be database logs (binlogs/undo logs).");
        }

    } catch (error) {
        console.error("❌ Diagnosis failed:", error.message);
    }
})();
