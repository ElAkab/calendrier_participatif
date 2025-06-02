const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const participants = [];

app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/submit-dates", (req, res) => {
	const { userName, selectedDates } = req.body;
	console.log("POST /submit-dates reçu :", { userName, selectedDates });

	if (!userName || !selectedDates || !Array.isArray(selectedDates)) {
		console.log("Données invalides reçues.");
		return res.status(400).json({ message: "Données invalides." });
	}

	// Vérifie si l'utilisateur existe déjà
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

// --- AJOUT DE CETTE ROUTE POUR TESTER LA RÉCEPTION DE DONNÉES ---

app.get("/api/dates", (req, res) => {
	console.log("GET /api/dates demandé");

	// Pour test, on renvoie simplement les dates de tous les participants
	const dates = participants.map((p) => ({
		userName: p.userName,
		selectedDates: p.selectedDates,
	}));

	console.log("Dates envoyées :", dates);

	res.json(dates);
});

app.delete("/clear", (req, res) => {
	console.log("DELETE /clear reçu, suppression des données");
	participants.length = 0;

	fs.writeFile("data.json", "[]", (err) => {
		if (err) {
			console.error("Erreur suppression :", err);
			return res.status(500).send("Erreur serveur");
		}
		console.log("Données supprimées avec succès");
		res.send("Données supprimées");
	});
});

app.delete("/delete-user/:userName", (req, res) => {
	const userName = req.params.userName;
	console.log(`DELETE /delete-user/${userName} demandé`);

	const index = participants.findIndex((p) => p.userName === userName);
	if (index === -1) {
		console.log(`Utilisateur introuvable : ${userName}`);
		return res.status(404).json({ message: "Utilisateur introuvable." });
	}

	participants.splice(index, 1);
	console.log(`Utilisateur supprimé : ${userName}`);
	res.json({ message: "Utilisateur supprimé avec succès." });
});

app.get("/", (req, res) => {
	res.send("Bienvenue sur le serveur backend ! 🎉");
});

app.listen(PORT, () => {
	console.log(`Serveur démarré sur le port ${PORT}`);
});
