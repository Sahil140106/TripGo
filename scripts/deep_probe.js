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
        req.setTimeout(60000, () => {
            req.destroy();
            reject(new Error('Request timed out - huge data volume!'));
        });
    });
};

(async () => {
    try {
        console.log("--- TripGo PRODUCTION Deep Probe ---");

        console.log("\n[1] Checking All Cars...");
        const cars = await request(`${API_BASE_URL}/cars`);
        console.log(`Found ${cars.length} cars.`);
        
        cars.forEach((car, index) => {
            const imgSize = car.imageUrl ? car.imageUrl.length : 0;
            console.log(`- Car ${index+1} (${car.name}): ${Math.round(imgSize / 1024)} KB`);
        });

        console.log("\n[2] Checking Users...");
        const users = await request(`${API_BASE_URL}/auth/users`);
        console.log(`Found ${users.length} users.`);
        
        let totalUserImgSize = 0;
        users.forEach((user, index) => {
            const picSize = user.profilePic ? user.profilePic.length : 0;
            totalUserImgSize += picSize;
            if (picSize > 100000) {
                console.log(`- User ${index+1} (${user.fullName}) has LARGE Profile Pic: ${Math.round(picSize / 1024)} KB`);
            }
        });
        console.log(`Total User Profile Pic Size: ${Math.round(totalUserImgSize / 1024)} KB`);

        console.log("\n[3] Checking Admins...");
        try {
            const admins = await request(`${API_BASE_URL}/auth/management-list`);
            console.log(`Found ${admins.length} admins.`);
        } catch (e) {
            console.log(`Admin Check failed: ${e.message}`);
        }

    } catch (error) {
        console.error("❌ Deep Probe failed:", error.message);
    }
})();
