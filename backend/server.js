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
		"postgresql://neondb_owner:npg_ciwr68XnaelI@ep-dry-bush-a2jyvwmq-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
});

const app = express();
const PORT = process.env.PORT || 3000;

const participants = [];
const votesByDate = {}; // stocke les noms par date

app.use(cors());
app.use(express.json());

// Sert les fichiers statiques (ex : HTML/CSS/JS frontend)
console.log(
	"Chemin des fichiers statiques :",
	path.join(__dirname, "..", "Résultats_public")
);

app.use(express.static(path.join(__dirname, "..")));
app.use(express.static(path.join(__dirname, "..", "Résultats_public")));

// Route pour index.html à la racine
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "index.html"));
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
		console.error("Erreur lors de la mise à jour en base :", error);
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
		console.error("Erreur récupération données :", error);
		res.status(500).json({ message: "Erreur serveur" });
	}
});

// --- Réinitialisation totale ---
app.delete("/clear", (req, res) => {
	participants.length = 0;
	for (const key in votesByDate) delete votesByDate[key];

	fs.writeFile("data.json", "[]", (err) => {
		if (err) {
			console.error("Erreur suppression :", err);
			return res.status(500).send("Erreur serveur");
		}
		res.send("Données supprimées");
	});
});

// --- Suppression d'un participant ---
app.delete("/delete-user/:userName", async (req, res) => {
	const userName = req.params.userName;

	const index = participants.findIndex((p) => p.userName === userName);
	if (index === -1) {
		return res.status(404).json({ message: "Utilisateur introuvable." });
	}

	participants.splice(index, 1);
	Object.keys(votesByDate).forEach((date) => {
		votesByDate[date] = votesByDate[date].filter((name) => name !== userName);
		if (votesByDate[date].length === 0) delete votesByDate[date];
	});

	// Supprimer en base PostgreSQL aussi
	try {
		await pool.query("DELETE FROM votes WHERE user_name = $1", [userName]);
	} catch (error) {
		console.error("Erreur suppression en base :", error);
		return res.status(500).json({ message: "Erreur serveur" });
	}

	res.json({ message: "Utilisateur supprimé avec succès." });
});

app.get("/", (req, res) => {
	res.send("Bienvenue sur l'API du calendrier participatif !");
});

// --- Routes statiques pour fichiers front ---
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "index.html"));
});

// --- Cette route envoie les données pour la page publique ---
app.get("/get-results", (req, res) => {
	const results = [
		{
			name: "Ali",
			selectedDates: ["2025-06-10", "2025-06-12"],
		},
		{
			name: "Hadja",
			selectedDates: ["2025-06-10"],
		},
	];
	res.json(results);
});

// --- Cette route sert la page HTML publique ---
app.get("/resultats-public.html", (req, res) => {
	res.sendFile(
		path.join(__dirname, "..", "Résultats_public", "resultats-public.html")
	);
});

app.get("/resultats.html", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "resultats.html"));
});

// --- Lancement du serveur ---
app.listen(PORT, () => {
	console.log(`Serveur démarré sur le port ${PORT}`);
});
