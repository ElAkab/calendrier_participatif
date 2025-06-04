const resultList = document.getElementById("result-list");
const BASE_URL =
	window.location.hostname === "localhost"
		? "http://localhost:3000"
		: "https://calendrier-participatif.onrender.com";

fetch(`${BASE_URL}/votes`)
	.then((res) => {
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		return res.json();
	})
	.then((participants) => {
		if (!Array.isArray(participants) || participants.length === 0) {
			resultList.innerHTML =
				"<li>Aucun participant ou dates sélectionnées.</li>";
			return;
		}

		// Calcul des votes par date
		const dateCount = {};
		participants.forEach(({ selectedDates }) => {
			selectedDates.forEach((date) => {
				dateCount[date] = (dateCount[date] || 0) + 1;
			});
		});

		const maxVotes =
			Object.values(dateCount).length > 0
				? Math.max(...Object.values(dateCount))
				: 0;

		// Affichage des participants
		participants.forEach(({ userName, selectedDates }) => {
			const participantDiv = document.createElement("div");
			participantDiv.classList.add("participant");

			const h2 = document.createElement("h2");
			h2.textContent = userName;
			participantDiv.appendChild(h2);

			const p = document.createElement("p");
			p.textContent = "Dates sélectionnées :";
			participantDiv.appendChild(p);

			const ul = document.createElement("ul");

			// Tri des dates avant affichage
			selectedDates.sort().forEach((date) => {
				const li = document.createElement("li");

				const [year, month, day] = date.slice(0, 10).split("-");
				const formattedDate = `${day}/${month}/${year}`;

				li.textContent = formattedDate;

				if (dateCount[date] === maxVotes && maxVotes > 1) {
					li.classList.add("popular");
					const span = document.createElement("span");
					span.textContent = " Unanimité !";
					li.appendChild(span);
				}

				ul.appendChild(li);
			});

			participantDiv.appendChild(ul);
			resultList.appendChild(participantDiv);
		});
	})
	.catch((error) => {
		console.error("Erreur lors du chargement :", error);
		resultList.innerHTML = "<li>Erreur lors du chargement des résultats.</li>";
	});

const users = [
	{ names: ["Ali"], placeholder: "C'est Ali ?" },
	{ names: ["Hadja"], placeholder: "C'est Hadja ?" },
	{ names: ["Mateusz"], placeholder: "C'est Mateusz ?" },
	{ names: ["Nisrine"], placeholder: "C'est Nisrine ?" },
	{ names: ["Anas"], placeholder: "C'est Anas ?" },
	{ names: ["Winnie"], placeholder: "C'est Winnie ?" },
	{
		names: ["Adam", "Adam Lamarti", "Adam (L)", "Adam L", "Adam La"],
		placeholder: "C'est Adam (L) ?",
		maxVotes: 2,
	},
	{ names: ["Salma"], placeholder: "C'est Salma ?" },
	{ names: ["Mohammed"], placeholder: "C'est Mohammed ?" },
	{ names: ["Myriam"], placeholder: "C'est Myriam ?" },
	{ names: ["Bilal"], placeholder: "C'est Bilal ?" },
];

fetch(`${BASE_URL}/votes`)
	.then((res) => {
		if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
		return res.json();
	})
	.then((participants) => {
		// --- Compter les votes réels depuis les données reçues ---
		const votedNames = participants.map((p) => p.userName.trim().toLowerCase());

		// Liste des noms attendus (incluant variantes)
		const expectedVoters = users.flatMap((user) =>
			user.names.map((n) => n.trim().toLowerCase())
		);

		// Supprimer les doublons
		const uniqueVotedNames = [...new Set(votedNames)];

		// Calcul du nombre total de votes attendus (maxVotes personnalisés pris en compte)
		const totalVotesExpected = users.reduce(
			(acc, user) => acc + (user.maxVotes || 1),
			0
		);

		// Nombre de votes réellement enregistrés
		const totalVotesCast = uniqueVotedNames.length;

		const votesMissing = totalVotesExpected - totalVotesCast;

		// --- Affichage du message ---
		const container = document.getElementById("message-container");
		if (container) {
			container.innerHTML = "";

			if (votesMissing > 0) {
				const message = document.createElement("p");
				message.textContent = `Il manque encore ${votesMissing} participant${
					votesMissing > 1 ? "s" : ""
				} à voter.`;
				message.style.fontStyle = "italic";
				message.style.color = "#007bff";
				container.appendChild(message);
			} else {
				container.textContent = "Tous les participants ont voté, merci ! 🎉";
			}
		}
	}); // ← il manquait celle-ci
