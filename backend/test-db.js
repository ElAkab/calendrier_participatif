// test-db.js
const { Client } = require("pg");

const client = new Client({
	connectionString:
		"postgresql://neondb_owner:npg_ciwr68XnaelI@ep-dry-bush-a2jyvwmq-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
	ssl: { rejectUnauthorized: false },
});

async function test() {
	try {
		await client.connect();
		console.log("✅ Connexion réussie à Neon");

		// Création de la table si elle n'existe pas
		await client.query(`
      CREATE TABLE IF NOT EXISTS test_dates (
        id SERIAL PRIMARY KEY,
        date TEXT
      )
    `);

		// Insertion d'une date de test
		await client.query("INSERT INTO test_dates (date) VALUES ($1)", [
			"2025-06-03",
		]);
		console.log("📤 Insertion réussie");

		// Lecture des dates
		const res = await client.query("SELECT * FROM test_dates");
		console.log("📥 Données récupérées :", res.rows);
	} catch (err) {
		console.error("❌ Erreur :", err);
	} finally {
		await client.end();
		console.log("🔌 Connexion fermée");
	}
}

test();
