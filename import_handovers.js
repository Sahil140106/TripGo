const fs = require('fs');
const http = require('http');

const API_URL = 'http://localhost:8080/api/handovers/store';
const DATA_FILE = 'handovers.json';

async function importData() {
    try {
        console.log(`Reading data from ${DATA_FILE}...`);
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const handovers = JSON.parse(rawData);
        
        console.log(`Found ${handovers.length} handover entries. Starting import...`);
        
        let successCount = 0;
        let failCount = 0;

        for (const item of handovers) {
            // Remove ID if present to let database generate new one
            delete item.id;
            
            const postData = JSON.stringify(item);
            
            const options = {
                hostname: 'localhost',
                port: 8080,
                path: '/api/handovers/store',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            await new Promise((resolve) => {
                const req = http.request(options, (res) => {
                    if (res.statusCode === 200) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`Failed to import item: Status ${res.statusCode}`);
                    }
                    resolve();
                });

                req.on('error', (e) => {
                    failCount++;
                    console.error(`Problem with request: ${e.message}`);
                    resolve();
                });

                req.write(postData);
                req.end();
            });
        }

        console.log('-----------------------------------------');
        console.log(`Import Finished!`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log('-----------------------------------------');
        if (failCount > 0) {
            console.log('NOTE: Make sure your Backend (localhost:8080) is running before importing.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

importData();
