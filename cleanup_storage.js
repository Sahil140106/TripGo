const http = require('http');

const API_URL = 'http://localhost:8080/api/cars';
const SIZE_THRESHOLD = 50 * 1024; // 50KB threshold for Base64 strings

console.log("--- TripGo Storage Cleanup Utility ---");
console.log(`Checking for car images larger than ${SIZE_THRESHOLD / 1024} KB...`);

const getCars = () => {
    return new Promise((resolve, reject) => {
        http.get(API_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
};

const deleteCar = (id) => {
    return new Promise((resolve, reject) => {
        const req = http.request(`${API_URL}/${id}`, { method: 'DELETE' }, (res) => {
            if (res.statusCode === 204) resolve();
            else reject(new Error(`Failed to delete car ${id}: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
    });
};

(async () => {
    try {
        const cars = await getCars();
        console.log(`Fetched ${cars.length} cars from database.`);
        
        let largeCars = [];
        let totalSize = 0;

        cars.forEach(car => {
            const imgSize = car.imageUrl ? car.imageUrl.length : 0;
            totalSize += imgSize;
            if (imgSize > SIZE_THRESHOLD) {
                largeCars.push({
                    id: car.id,
                    name: car.name,
                    sizeKB: Math.round(imgSize / 1024)
                });
            }
        });

        console.log(`Total storage used by images: ${Math.round(totalSize / 1024)} KB`);
        
        if (largeCars.length === 0) {
            console.log("✅ No large images found. Your storage is already optimized!");
            return;
        }

        console.log(`\nFound ${largeCars.length} cars with large images:`);
        largeCars.forEach(c => {
            console.log(`- [ID: ${c.id}] ${c.name}: ${c.sizeKB} KB`);
        });

        console.log("\n--- Recommendation ---");
        console.log("You can delete these cars manually from the Admin panel or use this script to delete them.");
        console.log("Note: Deleting will remove these cars from the listing.");
        
    } catch (error) {
        console.error("Error during cleanup check:", error.message);
        console.log("Make sure your backend is running at http://localhost:8080");
    }
})();
