// Using native fetch in Node.js v24

const LOCAL_URL = 'http://localhost:8080/api/cars';
const RENDER_URL = 'https://tripgo-backend-34la.onrender.com/api/cars';
const LOCAL_HANDOVER_URL = 'http://localhost:8080/api/handovers';
const RENDER_HANDOVER_URL = 'https://tripgo-backend-34la.onrender.com/api/handovers';

async function syncCars() {
    console.log("--- Syncing Cars ---");
    console.log("Reading local cars...");
    try {
        const localRes = await fetch(LOCAL_URL);
        const localCars = await localRes.json();
        console.log(`Found ${localCars.length} cars locally.`);

        console.log("Checking Render cars...");
        const renderRes = await fetch(RENDER_URL);
        const renderCars = await renderRes.json();
        const renderNames = renderCars.map(c => c.name);
        console.log(`Found ${renderCars.length} cars on Render.`);

        for (const car of localCars) {
            if (renderNames.includes(car.name)) {
                console.log(`Skipping existing car: ${car.name}`);
                continue;
            }

            console.log(`Syncing: ${car.name}...`);
            const { id, ...carData } = car;
            const postRes = await fetch(RENDER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carData)
            });

            if (postRes.ok) console.log(`Successfully synced: ${car.name}`);
            else console.error(`Failed to sync: ${car.name}. Status: ${postRes.status}`);
        }
    } catch (err) { console.error("Cars Sync Error:", err.message); }
}

async function syncHandovers() {
    console.log("--- Syncing Handovers ---");
    try {
        const localRes = await fetch(LOCAL_HANDOVER_URL);
        const localHandovers = await localRes.json();
        console.log(`Found ${localHandovers.length} handovers locally.`);

        const renderRes = await fetch(RENDER_HANDOVER_URL);
        const renderHandovers = await renderRes.json();
        const renderNotes = renderHandovers.map(h => h.notes);

        for (const h of localHandovers) {
            // Simple check using notes/details to avoid duplicates
            if (renderNotes.includes(h.notes)) {
                console.log(`Skipping existing handover: ${h.carModel}`);
                continue;
            }

            console.log(`Syncing Handover: ${h.carModel}...`);
            const { id, ...hData } = h;
            const postRes = await fetch(`${RENDER_HANDOVER_URL}/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hData)
            });

            if (postRes.ok) console.log(`Successfully synced handover: ${h.carModel}`);
            else console.error(`Failed to sync handover: ${h.carModel}. Status: ${postRes.status}`);
        }
    } catch (err) { console.error("Handovers Sync Error:", err.message); }
}

async function sync() {
    await syncCars();
    await syncHandovers();
    console.log("All sync operations complete!");
}

sync();
