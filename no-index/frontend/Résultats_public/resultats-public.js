document.addEventListener("DOMContentLoaded", () => {
	// Fix mobile 100vh bug
	function setVh() {
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty("--vh", `${vh}px`);
	}
	setVh();
	window.addEventListener("resize", setVh);

	const resultList = document.getElementById("result-list");
	const messageContainer = document.getElementById("message-container");
	const BASE_URL =
		window.location.hostname === "localhost"
			? "http://localhost:3000"
			: "https://calendrier-participatif-backend.onrender.com";

	const users = [
		{ names: ["Ali"], placeholder: "C'est Ali ?" },
		{ names: ["Hadja"], placeholder: "C'est Hadja ?" },
		{ names: ["Mateusz"], placeholder: "C'est Mateusz ?" },
		{ names: ["Nisrine"], placeholder: "C'est Nisrine ?" },
		{ names: ["Anas"], placeholder: "C'est Anas ?" },
		{ names: ["Winnie"], placeholder: "C'est Winnie ?" },
		{
			names: [
				"Adam",
				"Adam Lamarti",
				"Adam (L)",
				"Adam L",
				"Adam E",
				"Adam La",
			],
			placeholder: "C'est Adam (L) ?",
			maxVotes: 2,
		},
		{ names: ["Salma"], placeholder: "C'est Salma ?" },
		{ names: ["Mohammed"], placeholder: "C'est Mohammed ?" },
		{ names: ["Myriam"], placeholder: "C'est Myriam ?" },
		{ names: ["Bilal"], placeholder: "C'est Bilal ?" },
	];

	function showMessage(text, duration = 3000) {
		messageContainer.textContent = text;
		messageContainer.classList.add("show");
		setTimeout(() => {
			messageContainer.classList.remove("show");
		}, duration);
	}
	// style
	async function loadVotesAndRender() {
		try {
			const res = await fetch(`${BASE_URL}/votes`);
			if (!res.ok) throw new Error("Erreur serveur");
			const participants = await res.json();

			// Message si aucun participant
			if (!participants || participants.length === 0) {
				resultList.style.listStyle = "none";
				resultList.innerHTML =
					"<li style='text-align:center;'>Y a rien ici... comme dans mon estomac d'ailleurs...<br>À toi de remplir !<br><small><em>(Pas mon estomac, mais après si tu veux m'offrir à manger, sache que j'aime ...)</em></small></li>";
				showMessage("Il manque absolument tout le monde 😪");
				return;
			}

			// --- Traitement : vote manquant ---
			const votedNames = participants.map((p) =>
				p.userName.trim().toLowerCase()
			);
			const uniqueVotedNames = [...new Set(votedNames)];
			const totalVotesExpected = users.reduce(
				(acc, user) => acc + (user.maxVotes || 1),
				0
			);
			const votesMissing = totalVotesExpected - uniqueVotedNames.length;

			// --- Affichage du message ---
			messageContainer.innerHTML = "";

			if (votesMissing > 0) {
				const message = document.createElement("p");
				message.textContent = `Il manque encore ${votesMissing} ${
					votesMissing > 1 ? "personnes" : "personne"
				}.`;
				message.style.color = "#fffff";
				messageContainer.appendChild(message);
			} else {
				messageContainer.textContent = "Tout le monde a voté";
			}

			// --- Calcul popularité des dates ---
			const dateCount = {};
			participants.forEach(({ selectedDates }) => {
				selectedDates.forEach((date) => {
					dateCount[date] = (dateCount[date] || 0) + 1;
				});
			});

			// --- Affichage résultats ---
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
		} catch (err) {
			console.error("Erreur lors du chargement des votes :", err);
			showMessage("Erreur de chargement des résultats. Réessaie plus tard.");
		}
	}

	// Chargement immédiat
	loadVotesAndRender();

	setInterval(loadVotesAndRender, 5000);
});
