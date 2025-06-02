const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const participants = [];
const votesByDate = {}; // Nouveau : stocke les noms par date (ex: "2025-06-05": ["Alice", "Bob"])

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

// --- Enregistrement des dates ---
app.post("/submit-dates", (req, res) => {
	const { userName, selectedDates } = req.body;
	console.log("POST /submit-dates reçu :", { userName, selectedDates });

	if (!userName || !selectedDates || !Array.isArray(selectedDates)) {
		console.log("Données invalides reçues.");
		return res.status(400).json({ message: "Données invalides." });
	}

	// Supprimer les anciennes dates de votesByDate
	Object.keys(votesByDate).forEach((date) => {
		votesByDate[date] = votesByDate[date].filter((name) => name !== userName);
		if (votesByDate[date].length === 0) delete votesByDate[date];
	});

	// Ajouter les nouvelles
	selectedDates.forEach((date) => {
		if (!votesByDate[date]) votesByDate[date] = [];
		if (!votesByDate[date].includes(userName)) votesByDate[date].push(userName);
	});

	// Mise à jour du tableau des participants
	const existingIndex = participants.findIndex((p) => p.userName === userName);
	if (existingIndex !== -1) {
		participants[existingIndex].selectedDates = selectedDates;
		console.log(`Mise à jour des dates pour ${userName}`);
	} else {
		participants.push({ userName, selectedDates });
		console.log(`Nouvel utilisateur ajouté : ${userName}`);
	}

	console.log("Participants actuels :", participants);
	res.status(200).json({ message: "Données bien reçues !" });
});

// --- Récupération des données ---
app.get("/all", (req, res) => {
	console.log("GET /all demandé");

	// Calcul des fréquences
	const dateCounts = {};
	participants.forEach((p) => {
		p.selectedDates.forEach((date) => {
			dateCounts[date] = (dateCounts[date] || 0) + 1;
		});
	});

	const totalParticipants = participants.length;
	const popularDates = Object.keys(dateCounts).filter(
		(date) => dateCounts[date] === totalParticipants && totalParticipants > 1
	);

	const result = participants.map((p) => ({
		userName: p.userName,
		selectedDates: p.selectedDates,
		popularDates: p.selectedDates.filter((date) => popularDates.includes(date)),
	}));

	console.log("Renvoi des données :", result);
	res.json(result);
});

// --- Récupération brute des dates (pour debug/test) ---
app.get("/api/dates", (req, res) => {
	console.log("GET /api/dates demandé");
	const dates = participants.map((p) => ({
		userName: p.userName,
		selectedDates: p.selectedDates,
	}));
	console.log("Dates envoyées :", dates);
	res.json(dates);
});

// --- Réinitialisation totale ---
app.delete("/clear", (req, res) => {
	console.log("DELETE /clear reçu, suppression des données");
	participants.length = 0;
	for (const key in votesByDate) delete votesByDate[key];

	fs.writeFile("data.json", "[]", (err) => {
		if (err) {
			console.error("Erreur suppression :", err);
			return res.status(500).send("Erreur serveur");
		}
		console.log("Données supprimées avec succès");
		res.send("Données supprimées");
	});
});

// --- Suppression d'un participant par prénom ---
app.delete("/delete-user/:userName", (req, res) => {
	const userName = req.params.userName;
	console.log(`DELETE /delete-user/${userName} demandé`);

	const index = participants.findIndex((p) => p.userName === userName);
	if (index === -1) {
		console.log(`Utilisateur introuvable : ${userName}`);
		return res.status(404).json({ message: "Utilisateur introuvable." });
	}

	// Supprime du tableau principal
	participants.splice(index, 1);

	// Supprime des votes par date
	Object.keys(votesByDate).forEach((date) => {
		votesByDate[date] = votesByDate[date].filter((name) => name !== userName);
		if (votesByDate[date].length === 0) delete votesByDate[date];
	});

	console.log(`Utilisateur supprimé : ${userName}`);
	res.json({ message: "Utilisateur supprimé avec succès." });
});

// --- Routes statiques ---
app.get("/all", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "resultats.html"));
});

app.get("/resultats.html", (req, res) => {
	res.sendFile(path.join(__dirname, "..", "resultats.html"));
});

// --- Lancement ---
app.listen(PORT, () => {
	console.log(`Serveur démarré sur le port ${PORT}`);
});
