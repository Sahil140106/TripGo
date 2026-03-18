const mysql = require('mysql2/promise');
const admin = require('firebase-admin');
require('dotenv').config();

// --- Firebase Initialization ---
const serviceAccount = require("./serviceAccountKey.json");
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// --- MySQL Connection ---
const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: 'harshi@123',
    database: 'tripgodb'
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(mysqlConfig);
        console.log("✅ Connected to MySQL");

        const [tableRows] = await connection.execute("SHOW TABLES");
        const tables = tableRows.map(row => Object.values(row)[0]);

        console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}`);

        for (const table of tables) {
            try {
                console.log(`\n⏳ Migrating table: ${table}...`);
                const [rows] = await connection.execute(`SELECT * FROM ${table}`);
                
                if (rows.length === 0) {
                    console.log(`ℹ️ Table ${table} is empty. Skipping.`);
                    continue;
                }

                const batch = db.batch();
                rows.forEach((row, index) => {
                    const docRef = db.collection(table).doc(row.id?.toString() || `doc_${index}`);
                    // Remove null values to avoid Firestore errors
                    const cleanRow = Object.fromEntries(Object.entries(row).filter(([_, v]) => v != null));
                    batch.set(docRef, cleanRow);
                });

                await batch.commit();
                console.log(`✅ Successfully migrated ${rows.length} records from ${table}.`);
            } catch (tableError) {
                console.warn(`⚠️ Failed to migrate table ${table}: ${tableError.message}`);
            }
        }

        console.log("\n✨ ALL DATA MIGRATED TO FIREBASE!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
