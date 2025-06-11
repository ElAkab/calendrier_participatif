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
	const BASE_URL = window.location.hostname.includes("test-modifs") // ou une autre partie de l’URL Netlify de test
		? "https://calendrier-participatif-backend-test.onrender.com"
		: window.location.hostname === "localhost"
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

	const VACANCES = {
		"Vacances d'hiver (Noël)": [
			["2024-12-24", "2025-01-05"],
			["2025-12-22", "2026-01-02"],
			["2026-12-27", "2027-01-03"],
			["2027-12-26", "2028-01-02"],
		],
		"Vacances de Carnaval": [
			["2025-02-24", "2025-03-09"],
			["2026-02-16", "2026-02-28"],
			["2027-02-15", "2027-02-21"],
			["2028-02-28", "2028-03-05"],
		],
		"Vacances de printemps (Pâques)": [
			["2025-04-28", "2025-05-11"],
			["2026-04-27", "2026-05-10"],
			["2027-04-05", "2027-04-18"],
			["2028-03-27", "2028-04-09"],
		],
		"Vacances d'été": [
			["2025-07-05", "2025-08-24"],
			["2026-07-04", "2026-08-24"],
			["2027-07-02", "2027-08-29"],
			["2028-07-02", "2028-08-28"],
		],
	};

	const VACANCES_COLORS = {
		"Vacances d'hiver (Noël)": "#1E90FF", // Bleu (Dodger Blue)
		"Vacances de Carnaval": "#800080", // Violet (Purple)
		"Vacances de printemps (Pâques)": "#32CD32", // Vert (Lime Green)
		"Vacances d'été": "#FFA500", // Orange
	};

	function createVacancesLegend() {
		const legendContainer = document.getElementById("vacancesLegend");
		if (!legendContainer) return; // sécurité si absent

		legendContainer.innerHTML = ""; // Vide le contenu

		for (const [vacName, color] of Object.entries(VACANCES_COLORS)) {
			const legendItem = document.createElement("div");
			legendItem.classList.add("vacances-legend-item");

			// Appliquer la couleur de texte à cet item
			legendItem.style.color = color;

			const colorBox = document.createElement("span");
			colorBox.classList.add("vacances-legend-circle");
			colorBox.style.backgroundColor = color; // couleur dynamique

			const label = document.createElement("span");
			label.textContent = vacName;

			legendItem.appendChild(colorBox);
			legendItem.appendChild(label);
			legendContainer.appendChild(legendItem);
		}
	}

	function updateGridColumns() {
		const legend = document.querySelector(".vacances-legend");
		if (!legend) return;

		// Récupérer le nombre réel de colonnes dans la grille CSS
		const computedStyle = getComputedStyle(legend);
		const columns = computedStyle
			.getPropertyValue("grid-template-columns")
			.split(" ").length;

		// On met ce nombre dans une variable CSS
		legend.style.setProperty("--columns-count", columns);
	}

	// Appelle cette fonction au chargement et au resize
	window.addEventListener("load", updateGridColumns);
	window.addEventListener("resize", updateGridColumns);

	function showMessage(text, duration = 3000) {
		messageContainer.textContent = text;
		messageContainer.classList.add("show");
		setTimeout(() => {
			messageContainer.classList.remove("show");
		}, duration);
	}

	// Fonction utilitaire pour vérifier si une date est dans une plage
	function isDateInRange(dateStr, startStr, endStr) {
		const date = new Date(dateStr);
		const start = new Date(startStr);
		const end = new Date(endStr);
		return date >= start && date <= end;
	}

	// Fonction principale pour obtenir la couleur correspondant à la date
	function getVacationColor(dateStr) {
		for (const [vacName, ranges] of Object.entries(VACANCES)) {
			for (const [start, end] of ranges) {
				if (isDateInRange(dateStr, start, end)) {
					return VACANCES_COLORS[vacName] || null;
				}
			}
		}
		return null; // Pas de vacances pour cette date
	}

	let isFirstLoad = true;
	let loaderInterval = null;

	function showLoader(message = "Chargement en cours") {
		let baseMessage = message;
		let dotCount = 0;

		loader.style.display = "block";

		// Nettoyer un éventuel ancien intervalle
		if (loaderInterval) {
			clearInterval(loaderInterval);
		}

		// Nettoyer un éventuel ancien timeout
		if (loaderTimeout) {
			clearTimeout(loaderTimeout);
		}

		// Démarrer l'animation des points
		loaderInterval = setInterval(() => {
			dotCount = (dotCount + 1) % 4; // 0, 1, 2, 3 => repart à 0
			let dots = ".".repeat(dotCount);
			loader.textContent = baseMessage + dots;
		}, 1000);

		// Après 5 secondes, afficher le message additionnel
		loaderTimeout = setTimeout(() => {
			// On ajoute un message sous le loader (par exemple dans un élément dédié)
			let extraMessage = document.createElement("div");
			extraMessage.textContent = "C'est toujours comme ça la première fois";
			loader.parentNode.appendChild(extraMessage);
		}, 5000);
	}

	function clearTimer(timer) {
		if (timer) {
			clearInterval(timer);
			clearTimeout(timer);
		}
		return null; // Toujours remettre la référence à null
	}

	function hideLoader() {
		// Cacher le loader
		loader.style.display = "none";

		// Arrêter l'animation et le délai
		loaderInterval = clearTimer(loaderInterval);
		loaderTimeout = clearTimer(loaderTimeout);

		// Réinitialiser le texte
		loader.textContent = "";
	}

	async function loadVotesAndRender() {
		let loaderTimeout;

		try {
			// Afficher le loader immédiatement pour le premier chargement
			if (isFirstLoad) {
				showLoader();
			} else {
				// Pour les chargements suivants : afficher le loader après 1 seconde seulement si c’est long
				loaderTimeout = setTimeout(() => {
					showLoader("Mise à jour des résultats...");
				}, 1000);
			}

			const res = await fetch(`${BASE_URL}/votes`);
			if (!res.ok) throw new Error("Erreur serveur");
			const participants = await res.json();

			// Cache le loader immédiatement si la réponse est rapide
			clearTimeout(loaderTimeout);
			hideLoader();

			isFirstLoad = false; // On n’est plus sur le premier chargement

			// --- Affichage ou message s’il n’y a pas de participants ---
			if (!participants || participants.length === 0) {
				resultList.style.listStyle = "none";
				resultList.innerHTML =
					"<li style='text-align:center;'>Y a rien ici... comme dans mon estomac d'ailleurs...<br>À toi de remplir !<br><small class='nowrap-ellipsis'><em>(Pas mon estomac, mais après si t'insiste je dis pas non.)</em></small></li>";

				// On vide aussi la légende si les participants sont absents
				const legendDiv = document.querySelector(".vacances-legend");
				if (legendDiv) {
					legendDiv.innerHTML = "";
				}

				showMessage("Il manque absolument tout le monde 😪");
				return;
			}

			const legendDiv = document.querySelector(".vacances-legend");
			if (legendDiv && legendDiv.innerHTML.trim() === "") {
				createVacancesLegend();
			}

			// --- Traitement des votes manquants ---
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
			messageContainer.innerHTML = ""; // On vide avant d'afficher un nouveau message

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

				selectedDates.sort().forEach((dateStr) => {
					const li = document.createElement("li");

					const dateObj = new Date(dateStr);
					const yyyy = dateObj.getFullYear();
					const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
					const dd = String(dateObj.getDate()).padStart(2, "0");
					const formatted = `${dd}/${mm}/${yyyy}`;
					const dateOnlyStr = `${yyyy}-${mm}-${dd}`;
					const color = getVacationColor(dateOnlyStr);
					li.textContent = formatted;
					if (color) {
						li.style.setProperty("color", color, "important");
						li.style.setProperty("font-weight", "bold", "important");
					}
					console.log("VACANCES COLOR POUR", formatted, "=>", color);

					if (
						participants.length > 1 &&
						dateCount[dateStr] === participants.length
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
			clearTimeout(loaderTimeout);
			hideLoader();
			showMessage(
				"Erreur de chargement des résultats, je répare ça le plus vite possible !"
			);
		} finally {
			clearTimeout(loaderTimeout);
			hideLoader();
		}
	}

	// Chargement initial
	loadVotesAndRender();

	// Rafraîchissement toutes les 5 secondes
	setInterval(loadVotesAndRender, 5000);
});
