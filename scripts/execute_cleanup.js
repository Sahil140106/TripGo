const https = require('https');

const API_BASE_URL = 'https://tripgo-backend-34la.onrender.com/api/cars';
const SIZE_THRESHOLD = 50 * 1024; // 50KB

const getCars = () => {
    return new Promise((resolve, reject) => {
        https.get(API_BASE_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

const deleteCar = (id) => {
    return new Promise((resolve, reject) => {
        const req = https.request(`${API_BASE_URL}/${id}`, { method: 'DELETE' }, (res) => {
            if (res.statusCode === 204) resolve();
            else reject(new Error(`Failed to delete car ${id}: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
    });
};

(async () => {
    try {
        console.log("--- TripGo Storage Cleanup EXECUTION ---");
        const cars = await getCars();
        console.log(`Fetched ${cars.length} cars.`);

        let deletedCount = 0;
        let skippedBooked = 0;

        for (const car of cars) {
            const imgSize = car.imageUrl ? car.imageUrl.length : 0;
            
            // Criteria: Large image AND not BOOKED
            if (imgSize > SIZE_THRESHOLD) {
                if (car.status === 'BOOKED') {
                    console.log(`[SKIP] Car ${car.id} (${car.name}) is BOOKED. Skipping.`);
                    skippedBooked++;
                } else {
                    console.log(`[DELETE] Car ${car.id} (${car.name}) - Size: ${Math.round(imgSize / 1024)} KB`);
                    await deleteCar(car.id);
                    deletedCount++;
                }
            }
        }

        console.log("\n--- Cleanup Results ---");
        console.log(`Total Cars Processed: ${cars.length}`);
        console.log(`Total Deleted: ${deletedCount}`);
        console.log(`Total Skipped (Booked): ${skippedBooked}`);
        console.log("\n✅ Storage Cleanup task completed. Please check your Aiven dashboard for reduction.");

    } catch (error) {
        console.error("❌ Cleanup failed:", error.message);
    }
})();
