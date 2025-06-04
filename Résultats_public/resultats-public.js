// Fonction pour récupérer et afficher les votes
async function refreshVotes() {
	try {
		const res = await fetch(`${BASE_URL}/votes`);
		if (!res.ok)
			throw new Error("Erreur serveur lors de la récupération des votes");

		const votes = await res.json();

		// Exemple simple : afficher dans un div avec id="votesList"
		const votesList = document.getElementById("votesList");
		if (!votesList) return;

		votesList.innerHTML = ""; // reset contenu

		votes.forEach(({ userName, selectedDates }) => {
			const userDiv = document.createElement("div");
			userDiv.textContent = `${userName} : ${selectedDates.join(", ")}`;
			votesList.appendChild(userDiv);
		});
	} catch (error) {
		console.error("Erreur refresh votes :", error);
	}
}

// Appel initial + rappel toutes les 5 secondes
refreshVotes();

// À placer dans un fichier JS chargé au démarrage
// Fix mobile 100vh bug
function setVh() {
	let vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setVh();
window.addEventListener("resize", setVh);

function showMessage(text, duration = 3000) {
	const messageContainer = document.getElementById("message-container");
	messageContainer.textContent = text;
	messageContainer.classList.add("show");

	setTimeout(() => {
		messageContainer.classList.remove("show");
	}, duration);
}

const resultList = document.getElementById("result-list");
const BASE_URL =
	window.location.hostname === "localhost"
		? "http://localhost:3000"
		: "https://calendrier-participatif.onrender.com";

fetch(`${BASE_URL}/votes`)
	.then((res) => {
		if (!res.ok) {
			throw new Error(`Erreur HTTP : ${res.status}`);
		}
		return res.json();
	})
	.then((participants) => {
		if (!Array.isArray(participants) || participants.length === 0) {
			resultList.style.listStyle = "none";
			resultList.style.textAlign = "center";
			resultList.innerHTML =
				"<li>Y a rien ici... comme dans mon estomac d'ailleurs...<br>À toi de remplir !<br><small><em>(Pas mon estomac, mais après si tu veux m'offrir à manger, sache que j'aime ...)</em></small></li>";

			// Montre un message en bas de l'écran
			showMessage("Aucun participant trouvé pour le moment.");
			return;
		} else {
			document.querySelector("span").style.display = "none";
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

		const container = document.createElement("div");
		container.classList.add("participants-container");

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

			selectedDates.sort().forEach((date) => {
				const li = document.createElement("li");
				const [year, month, day] = date.slice(0, 10).split("-");
				const formattedDate = `${day}/${month}/${year}`;

				li.textContent = formattedDate;

				if (
					participants.length > 1 &&
					dateCount[date] === participants.length
				) {
					li.classList.add("popular");
					const span = document.createElement("span");
					span.textContent = " Unanimité !";
					li.appendChild(span);
				}

				ul.appendChild(li);
			});

			participantDiv.appendChild(ul);
			container.appendChild(participantDiv);
		});

		resultList.innerHTML = "";
		resultList.appendChild(container);

		// Facultatif : afficher un message bref de succès
		showMessage("Résultats chargés avec succès !", 2000);
	})
	.catch((error) => {
		console.error("Erreur lors du chargement des votes :", error);
		showMessage("Erreur de chargement des résultats. Réessaie plus tard.");
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
				message.textContent = `Il manque encore ${votesMissing} ${
					votesMissing > 1 ? "personnes" : "personne"
				}.`;
				message.style.fontStyle = "italic";
				message.style.color = "#007bff";
				container.appendChild(message);
			} else {
				container.textContent = "Tout le monde a voté ! 🎉";
			}
		}
	});
