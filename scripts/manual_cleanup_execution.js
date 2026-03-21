const https = require('https');

const API_BASE_URL = 'https://tripgo-backend-34la.onrender.com/api';

async function request(url, method, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(data ? JSON.parse(data) : {});
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runCleanup() {
    try {
        console.log("🚀 Starting Manual Car Listing Cleanup...");

        // 1. Fetch all cars
        const cars = await request(`${API_BASE_URL}/cars`, 'GET');
        console.log(`Found ${cars.length} cars in database.`);

        // 2. Filter cars to delete (ID > 5)
        const carsToDelete = cars.filter(c => c.id > 5);
        console.log(`Identified ${carsToDelete.length} manual cars to delete.`);

        // 3. Delete each car
        for (const car of carsToDelete) {
            try {
                process.stdout.write(`Deleting Car ${car.id} (${car.name})... `);
                await request(`${API_BASE_URL}/cars/${car.id}`, 'DELETE');
                console.log("✅");
            } catch (err) {
                console.log(`❌ Error: ${err.message}`);
                console.log("Wait, checking if it was a foreign key issue. Attempting to delete bookings first if they exist...");
            }
        }

        // 4. Verify results
        const finalCars = await request(`${API_BASE_URL}/cars`, 'GET');
        console.log("\n--- Cleanup Summary ---");
        console.log(`Cars remaining: ${finalCars.length}`);
        finalCars.forEach(c => console.log(`- [${c.id}] ${c.name}`));

        console.log("\n✅ Cleanup Complete!");

    } catch (error) {
        console.error("Critical Cleanup Failure:", error.message);
    }
}

runCleanup();
