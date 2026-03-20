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
        let renderData = [];
        try {
            renderData = await renderRes.json();
        } catch (e) {
            console.warn(`Warning: Could not fetch ${name} list from Render (maybe endpoint not ready).`);
            renderData = [];
        }
        
        // Case-insensitive key matching for emails
        const renderKeys = Array.isArray(renderData) 
            ? renderData.map(item => String(item[uniqueKey] || '').toLowerCase()) 
            : [];
            
        console.log(`Found ${renderKeys.length} ${name} on Render.`);

        for (const item of localData) {
            const val = String(item[uniqueKey] || '').toLowerCase();
            if (renderKeys.includes(val)) {
                // console.log(`Skipping existing ${name}: ${val}`);
                continue;
            }

            console.log(`Syncing ${name}: ${val}...`);
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
    await syncEntity('Admins', '/auth/management-list', '/auth/management-store', 'email');
    await syncEntity('Users', '/auth/users', '/auth/users/store', 'email');
    await syncEntity('Cars', '/cars', '/cars', 'name');
    await syncEntity('ListedCars', '/listed-cars', '/listed-cars/store', 'id');
    await syncEntity('Bookings', '/bookings', '/bookings/store', 'id');
    await syncEntity('Handovers', '/handovers', '/handovers/store', 'bookingId');
    await syncEntity('Transactions', '/transactions', '/transactions/store', 'id');
    await syncEntity('Messages', '/messages', '/messages/sendDirect', 'id');
    await syncEntity('Payments', '/payments', '/payments/store', 'id');
    
    console.log("\n🚀 All synchronization operations complete!");
}

startSync();
