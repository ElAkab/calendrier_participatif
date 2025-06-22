const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const { Pool } = require("pg");

const pool = new Pool({
	connectionString:
		process.env.DATABASE_URL ||
		"postgresql://neondb_owner:npg_T1yFpsJ5xmZG@ep-dry-bush-a2jyvwmq-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
});

const app = express();
const PORT = process.env.PORT || 3000;

const participants = [];
const votesByDate = {}; // stocke les noms par date

const allowedOrigins = [
	"https://calendrier-participatif-backend.onrender.com",
	"https://jour-j-calendry-3000.netlify.app",
	"http://localhost:3000",
	"http://127.0.0.1:5500", // Ajoute cette ligne
];

const corsOptions = {
	origin: function (origin, callback) {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
	methods: ["GET", "POST", "DELETE"],
	credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Sert les fichiers statiques (ex : HTML/CSS/JS frontend)
console.log(
	"Chemin des fichiers statiques :",
	path.join(__dirname, "..", "Résultats_public")
);

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(
	express.static(path.join(__dirname, "..", "frontend", "Résultats_public"))
);

// Route pour index.html à la racine
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// --- Enregistrement des votes ---
app.post("/submit-dates", async (req, res) => {
	const { userName, selectedDates } = req.body;
	console.log("POST /submit-dates reçu :", { userName, selectedDates });

	if (!userName || !selectedDates || !Array.isArray(selectedDates)) {
		return res.status(400).json({ message: "Données invalides." });
	}

	try {
		// Mise à jour en mémoire
		Object.keys(votesByDate).forEach((date) => {
			votesByDate[date] = votesByDate[date].filter((name) => name !== userName);
			if (votesByDate[date].length === 0) delete votesByDate[date];
		});

		selectedDates.forEach((date) => {
			if (!votesByDate[date]) votesByDate[date] = [];
			if (!votesByDate[date].includes(userName))
				votesByDate[date].push(userName);
		});

		const existingIndex = participants.findIndex(
			(p) => p.userName === userName
		);
		if (existingIndex !== -1) {
			participants[existingIndex].selectedDates = selectedDates;
		} else {
			participants.push({ userName, selectedDates });
		}

		// Mise à jour en base PostgreSQL
		await pool.query("DELETE FROM votes WHERE user_name = $1", [userName]);

		await Promise.all(
			selectedDates.map((date) =>
				pool.query(
					"INSERT INTO votes (user_name, selected_date) VALUES ($1, $2)",
					[userName, date]
				)
			)
		);

		res
			.status(200)
			.json({ message: "Données bien reçues et enregistrées en base !" });
	} catch (error) {
		console.error(
			"Erreur lors de la mise à jour en base :",
			error + "Je répare ça le plus vite possible !"
		);
		res.status(500).json({ message: "Erreur serveur lors de la sauvegarde." });
	}
});

// --- Récupération des votes ---
app.get("/votes", async (req, res) => {
	try {
		const { rows } = await pool.query(
			"SELECT user_name, selected_date FROM votes"
		);

		const participantsMap = new Map();

		rows.forEach(({ user_name, selected_date }) => {
			if (!participantsMap.has(user_name)) {
				participantsMap.set(user_name, []);
			}
			participantsMap.get(user_name).push(selected_date);
		});

		const participants = Array.from(
			participantsMap,
			([userName, selectedDates]) => ({ userName, selectedDates })
		);

		// Calcul des dates populaires choisies par tous les participants
		const totalParticipants = participants.length;
		const dateCounts = {};

		participants.forEach(({ selectedDates }) => {
			selectedDates.forEach((date) => {
				dateCounts[date] = (dateCounts[date] || 0) + 1;
			});
		});

		const popularDates = Object.keys(dateCounts).filter(
			(date) => dateCounts[date] === totalParticipants && totalParticipants > 1
		);

		const result = participants.map(({ userName, selectedDates }) => ({
			userName,
			selectedDates,
			popularDates: selectedDates.filter((date) => popularDates.includes(date)),
		}));

		res.json(result);
	} catch (error) {
		console.error(
			"Erreur récupération données :",
			error + "Je répare ça le plus vite possible !"
		);
		res.status(500).json({ message: "Erreur serveur" });
	}
});

app.post("/register-user", async (req, res) => {
	try {
		const { name } = req.body;
		if (!name) return res.status(400).json({ error: "Nom manquant" });

		// Vérifier si le nom existe déjà
		const checkQuery = "SELECT COUNT(*) FROM users WHERE LOWER(name) = $1";
		const checkResult = await pool.query(checkQuery, [name.toLowerCase()]);
		if (parseInt(checkResult.rows[0].count, 10) > 0) {
			return res.status(409).json({ error: "Nom déjà pris" });
		}

		// Insérer le nom
		const insertQuery = "INSERT INTO users (name) VALUES ($1)";
		await pool.query(insertQuery, [name]);

		res.status(201).json({ message: "Utilisateur enregistré" });
	} catch (error) {
		console.error("Erreur lors de l'enregistrement utilisateur :", error);
		res.status(500).json({ error: "Erreur serveur" });
	}
});

app.post("/is-name-taken", async (req, res) => {
	console.log("Corps reçu :", req.body);

	try {
		const { name } = req.body;
		if (!name) return res.status(400).json({ error: "Nom manquant" });

		const query = "SELECT COUNT(*) FROM users WHERE LOWER(name) = $1";
		const values = [name.toLowerCase()];

		const result = await pool.query(query, values);
		const count = parseInt(result.rows[0].count, 10);

		return res.json({ isTaken: count > 0 });
	} catch (err) {
		console.error("Erreur serveur :", err);
		return res.status(500).json({ error: "Erreur serveur" });
	}
});

// --- Réinitialisation totale ---
app.delete("/clear", async (req, res) => {
	try {
		participants.length = 0;
		for (const key in votesByDate) delete votesByDate[key];

		// Vider le fichier local (data.json)
		await fs.promises.writeFile("data.json", "[]");

		// Vider la table PostgreSQL
		await pool.query("DELETE FROM votes");

		res.send("Données supprimées");
	} catch (err) {
		console.error(
			"Erreur suppression :",
			err + "Je répare ça le plus vite possible !"
		);
		res.status(500).send("Erreur serveur");
	}
});

// --- Suppression d'un utilisateur depuis la table "users" ---
app.delete("/delete-user/:userName", async (req, res) => {
	const userName = req.params.userName;
	console.log("🔴 Demande de suppression de :", userName);

	// Supprimer côté mémoire
	const index = participants.findIndex((p) => p.userName === userName);
	if (index !== -1) {
		participants.splice(index, 1);
		Object.keys(votesByDate).forEach((date) => {
			votesByDate[date] = votesByDate[date].filter((name) => name !== userName);
			if (votesByDate[date].length === 0) delete votesByDate[date];
		});
	}

	try {
		// Supprimer les votes de l'utilisateur
		await pool.query("DELETE FROM votes WHERE user_name = $1", [userName]);

		// Supprimer l'utilisateur dans la table users
		await pool.query("DELETE FROM users WHERE name = $1", [userName]);

		console.log("✅ Votes + utilisateur supprimés :", userName);
		res.json({ message: "Utilisateur et votes supprimés avec succès." });
	} catch (error) {
		console.error("❌ Erreur suppression en base :", error);
		res.status(500).json({ message: "Erreur serveur" });
	}
});

// --- Routes statiques pour fichiers front ---
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "index.html"));
});

// --- Cette route envoie les données pour la page publique ---
app.get("/get-results", (req, res) => {
	const results = [];
	res.json(results);
});

// --- Cette route sert la page HTML publique ---
app.get("/resultats-public.html", (req, res) => {
	res.sendFile(
		path.join(
			__dirname,
			"..",
			"frontend",
			"Résultats_public",
			"resultats-public.html"
		)
	);
});

app.get("/resultats.html", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "frontend", "resultats.html"));
});

app.get("/api/ping", async (req, res) => {
	try {
		await pool.query("SELECT 1");
		res.status(200).send("Pong");
	} catch (err) {
		console.error("Erreur ping :", err);
		res.status(500).send("Erreur serveur");
	}
});

// --- Lancement du serveur ---
app.listen(PORT, () => {
	console.log(`Serveur démarré sur le port ${PORT}`);
});
