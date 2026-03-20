// Comprehensive Sync Script for TripGo
// Syncs local data to Render production environment

const API_BASE_LOCAL = 'http://localhost:8080/api';
const API_BASE_RENDER = 'https://tripgo-backend-34la.onrender.com/api';

async function syncEntity(name, localPath, renderPath, uniqueKey = 'id') {
    console.log(`\n--- Syncing ${name} ---`);
    try {
        const localRes = await fetch(`${API_BASE_LOCAL}${localPath}`);
        const localData = await localRes.json();
        console.log(`Found ${localData.length} ${name} locally.`);

        const renderRes = await fetch(`${API_BASE_RENDER}${localPath}`);
        const renderData = await renderRes.json();
        const renderKeys = renderData.map(item => item[uniqueKey]);
        console.log(`Found ${renderData.length} ${name} on Render.`);

        for (const item of localData) {
            if (renderKeys.includes(item[uniqueKey])) {
                // console.log(`Skipping existing ${name}: ${item[uniqueKey]}`);
                continue;
            }

            console.log(`Syncing ${name}: ${item[uniqueKey]}...`);
            const postRes = await fetch(`${API_BASE_RENDER}${renderPath || localPath}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });

            if (postRes.ok) console.log(`Successfully synced ${name}`);
            else console.error(`Failed to sync ${name}. Status: ${postRes.status}`);
        }
    } catch (err) { console.error(`${name} Sync Error:`, err.message); }
}

async function startSync() {
    // Order matters for foreign keys
    await syncEntity('Admins', '/auth/admins', '/auth/admins/store', 'email');
    await syncEntity('Users', '/auth/users', '/auth/users/store', 'email');
    await syncEntity('Cars', '/cars', '/cars', 'name'); // Cars don't have a specific store endpoint usually, standard POST works
    await syncEntity('ListedCars', '/listed-cars', '/listed-cars/store', 'id');
    await syncEntity('Bookings', '/bookings', '/bookings/store', 'id');
    await syncEntity('Handovers', '/handovers', '/handovers/store', 'bookingId');
    await syncEntity('Transactions', '/transactions', '/transactions/store', 'id');
    await syncEntity('Messages', '/messages', '/messages/sendDirect', 'id');
    await syncEntity('Payments', '/payments', '/payments/store', 'id');
    
    console.log("\n🚀 All synchronization operations complete!");
}

startSync();
