const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const participants = [];

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/submit-dates", (req, res) => {
	const { userName, selectedDates } = req.body;

	if (!userName || !selectedDates || !Array.isArray(selectedDates)) {
		return res.status(400).json({ message: "Données invalides." });
	}

	// 🔍 Vérifie si l'utilisateur existe déjà
	const existingIndex = participants.findIndex((p) => p.userName === userName);

	if (existingIndex !== -1) {
		// ✏️ Met à jour ses dates
		participants[existingIndex].selectedDates = selectedDates;
	} else {
		// ➕ Sinon, ajoute-le
		participants.push({ userName, selectedDates });
	}

	console.log("Participants actuels :", participants);

	res.status(200).json({ message: "Données bien reçues !" });
});

app.get("/all", (req, res) => {
	// Calcul des fréquences
	const dateCounts = {};
	participants.forEach((p) => {
		p.selectedDates.forEach((date) => {
			dateCounts[date] = (dateCounts[date] || 0) + 1;
		});
	});

	// Liste des dates populaires (choisies par au moins 2 personnes)
	const totalParticipants = participants.length;
	const popularDates = Object.keys(dateCounts).filter(
		(date) => dateCounts[date] === totalParticipants
	);

	// On ajoute à chaque participant une liste de ses dates populaires
	const result = participants.map((p) => ({
		userName: p.userName,
		selectedDates: p.selectedDates,
		popularDates: p.selectedDates.filter((date) => popularDates.includes(date)),
	}));

	res.json(result);
});

app.delete("/clear", (req, res) => {
	participants.length = 0;

	fs.writeFile("data.json", "[]", (err) => {
		if (err) {
			console.error("Erreur suppression :", err);
			return res.status(500).send("Erreur serveur");
		}
		res.send("Données supprimées");
	});
});

app.delete("/delete-user/:userName", (req, res) => {
	const userName = req.params.userName;

	const index = participants.findIndex((p) => p.userName === userName);
	if (index === -1) {
		return res.status(404).json({ message: "Utilisateur introuvable." });
	}

	participants.splice(index, 1);
	console.log(`Utilisateur supprimé : ${userName}`);
	res.json({ message: "Utilisateur supprimé avec succès." });
});

app.listen(PORT, () => {
	console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
