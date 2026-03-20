const http = require('http');

async function fetchJson(path) {
    return new Promise((resolve, reject) => {
        http.get({ hostname: 'localhost', port: 8080, path }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function simulate() {
    try {
        console.log("Fetching data for simulation...");
        const allCars = await fetchJson('/api/cars');
        const allHandovers = await fetchJson('/api/handovers');
        
        console.log(`Simulating render for ${allCars.length} cars and ${allHandovers.length} handovers.`);
        
        const handoverCarModels = (allHandovers || []).map(h => h.carModel);
        
        const rendered = allCars.map(car => {
            try {
                const name = car.name || "Unknown Car";
                const status = (car.status || 'AVAILABLE').toUpperCase();
                // Simulation of the template string logic
                const isHandover = handoverCarModels.includes(name);
                return `ID: ${car.id}, Name: ${name}, Status: ${status}, IsHandover: ${isHandover}`;
            } catch (err) {
                console.error(`Error rendering car ${car.id}:`, err.message);
                return null;
            }
        });

        console.log(`Successfully simulated rendering of ${rendered.filter(r => r).length} cars.`);
        if (rendered.length > 0) {
            console.log("Sample render:", rendered[0]);
        }
    } catch (err) {
        console.error("Simulation failed:", err.message);
    }
}

simulate();
