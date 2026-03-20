const http = require('http');

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/cars',
    method: 'GET',
    timeout: 30000 // 30 seconds timeout
};

console.log("Probing API: http://localhost:8080/api/cars ...");

const req = http.request(options, (res) => {
    let rawData = '';
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    res.on('data', (chunk) => {
        rawData += chunk;
        if (rawData.length < 500) {
            // console.log(`Received chunk of size ${chunk.length}`);
        }
    });

    res.on('end', () => {
        try {
            console.log(`Total data received: ${rawData.length} bytes`);
            const parsedData = JSON.parse(rawData);
            console.log(`Successfully parsed JSON. Found ${parsedData.length} cars.`);
            if (parsedData.length > 0) {
                console.log("First car name:", parsedData[0].name);
            }
        } catch (e) {
            console.error("JSON Parse Error:", e.message);
            console.log("Raw Data snippet:", rawData.substring(0, 100));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.on('timeout', () => {
    console.error('Request timed out!');
    req.destroy();
});

req.end();
