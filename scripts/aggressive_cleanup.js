const https = require('https');

const API_BASE_URL = 'https://tripgo-backend-34la.onrender.com/api';

const request = (url, method, payload = null) => {
    return new Promise((resolve, reject) => {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data ? JSON.parse(data) : null);
                } else {
                    reject(new Error(`API Error: ${res.statusCode} for ${url}`));
                }
            });
        });
        req.on('error', reject);
        if (payload) req.write(JSON.stringify(payload));
        req.end();
    });
};

(async () => {
    try {
        console.log("--- TripGo AGGRESSIVE Storage Cleanup ---");

        // 1. Clear Handovers
        console.log("\n[1] Clearing Handovers...");
        const handovers = await request(`${API_BASE_URL}/handovers`, 'GET');
        console.log(`Found ${handovers.length} handovers.`);
        for (const h of handovers) {
            console.log(`Deleting Handover ${h.id}...`);
            await request(`${API_BASE_URL}/handovers/${h.id}`, 'DELETE');
        }
        console.log("✅ All handovers cleared.");

        // 2. Nullify Images for BOOKED Cars
        console.log("\n[2] Nullifying Images for BOOKED Cars...");
        const cars = await request(`${API_BASE_URL}/cars`, 'GET');
        let nullifiedCount = 0;
        for (const car of cars) {
            if (car.status === 'BOOKED' && car.imageUrl && car.imageUrl.length > 50000) {
                console.log(`Nullifying image for Booked Car ${car.id} (${car.name})...`);
                // We use PUT to update only the image
                await request(`${API_BASE_URL}/cars/${car.id}`, 'PUT', { 
                    ...car,
                    imageUrl: null 
                });
                nullifiedCount++;
            }
        }
        console.log(`✅ Nullified images for ${nullifiedCount} booked cars.`);

        console.log("\n--- Cleanup Results ---");
        console.log(`Handovers Deleted: ${handovers.length}`);
        console.log(`Booked Car Images Nullified: ${nullifiedCount}`);
        console.log("\n🚀 Aggressive Cleanup Completed. Aiven storage should drop significantly soon.");

    } catch (error) {
        console.error("❌ Aggressive Cleanup failed:", error.message);
    }
})();
