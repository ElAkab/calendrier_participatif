console.log("JS chargé");

const BASE_URL =
	window.location.hostname === "localhost"
		? "http://localhost:3000"
		: "https://calendrier-participatif.onrender.com";

function safeParseJSON(raw) {
	try {
		return JSON.parse(raw) || [];
	} catch {
		return [];
	}
}

// Gestion du modal de bienvenue
document.addEventListener("DOMContentLoaded", () => {
	const modal = document.getElementById("welcomeModal");
	const input = document.getElementById("userNameInput");
	const btn = document.getElementById("submitNameBtn");
	const nameMessage = document.getElementById("nameMessage");
	const resetBtn = document.getElementById("resetNamesBtn");

	if (!modal || !input || !btn || !nameMessage || !resetBtn) return;

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

	// Récupération des votes stockés
	const allNamesRaw = localStorage.getItem("allUserNames") || "[]";
	const allNames = JSON.parse(allNamesRaw).map((n) => n.trim().toLowerCase());

	// Filtrer les utilisateurs disponibles
	const availableUsers = users.filter((user) => {
		const maxVotes = user.maxVotes || 1;
		const count = allNames.filter((name) =>
			user.names.some((n) => n.trim().toLowerCase() === name)
		).length;
		return count < maxVotes;
	});

	const randomIndex = Math.floor(Math.random() * availableUsers.length);
	input.placeholder =
		availableUsers.length > 0
			? availableUsers[randomIndex].placeholder
			: "Plus de prénoms disponibles";

	function getAllNames() {
		const raw = localStorage.getItem("allUserNames");
		return raw ? JSON.parse(raw) : [];
	}

	function saveName(name) {
		const allNames = getAllNames();
		allNames.push(name);
		localStorage.setItem("allUserNames", JSON.stringify(allNames));
	}

	function isAllowedName(inputName) {
		const lower = inputName.trim().toLowerCase();
		return users.some((user) =>
			user.names.some((n) => n.toLowerCase() === lower)
		);
	}

	function isNameTaken(inputName) {
		const lower = inputName.trim().toLowerCase();
		const allNames = getAllNames().map((n) => n.trim().toLowerCase());

		const user = users.find((user) =>
			user.names.some((n) => n.toLowerCase() === lower)
		);
		if (!user) return true;

		const maxVotes = user.maxVotes || 1;
		const count = allNames.filter((n) =>
			user.names.some((variant) => variant.toLowerCase() === n)
		).length;

		return count >= maxVotes;
	}

	function checkName() {
		const storedName = localStorage.getItem("userName");
		if (!storedName) {
			modal.classList.add("active");
			nameMessage.textContent = "";
			input.classList.remove("invalid");
			input.focus();
		} else {
			modal.classList.remove("active");
			console.log(`Bienvenue de nouveau, ${storedName} !`);
		}
	}

	btn.addEventListener("click", () => {
		input.classList.remove("invalid");
		nameMessage.style.color = "#e74c3c";
		nameMessage.textContent = "";

		const name = input.value.trim();

		if (name.length === 0) {
			nameMessage.textContent = "Merci de saisir un prénom.";
			input.classList.add("invalid");
			return;
		}

		if (!isAllowedName(name)) {
			nameMessage.textContent = "Ce prénom n'est pas reconnu.";
			input.classList.add("invalid");
			alert("Connais pas...");
			return;
		}

		if (isNameTaken(name)) {
			nameMessage.textContent =
				"Ce prénom a déjà été utilisé. Merci de ne pas voter plusieurs fois.";
			input.classList.add("invalid");
			return;
		}

		localStorage.setItem("userName", name);
		saveName(name);
		modal.classList.remove("active");
		console.log(`On dirait bien que c'est, ${name} 😱 !`);
	});

	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			btn.click();
		}
	});

	resetBtn.addEventListener("click", () => {
		const userName = localStorage.getItem("userName");

		if (userName) {
			fetch(`${BASE_URL}/delete-user/${encodeURIComponent(userName)}`, {
				method: "DELETE",
			})
				.then((res) => {
					if (!res.ok) throw new Error("Erreur serveur");
					console.log(`Utilisateur ${userName} supprimé du serveur.`);
				})
				.catch((err) => {
					console.error("Erreur lors de la suppression côté serveur :", err);
				});
		}

		// Le reste de ton code...
		localStorage.removeItem("allUserNames");
		localStorage.removeItem("userName");
		localStorage.removeItem("selectedDates");

		alert("Toutes les données ont été réinitialisées.");

		modal.classList.add("active");
		input.value = "";
		input.classList.remove("invalid");
		nameMessage.textContent = "";

		const allSelected = document.querySelectorAll(".selected");
		allSelected.forEach((el) => el.classList.remove("selected"));

		const output = document.querySelector("#output");
		if (output) output.textContent = "";

		location.reload(); // forcer l'actualisation
	});

	checkName();
});

const nameInput = document.getElementById("name");
const saveNameBtn = document.getElementById("saveName");

// Si les éléments existent, on ajoute l'écouteur d'événement
if (nameInput && saveNameBtn) {
	nameInput.maxLength = 20;

	saveNameBtn.addEventListener("click", () => {
		const rawName = nameInput.value;
		const cleanName = sanitizeName(rawName);

		if (!cleanName) {
			alert("Veuillez entrer un prénom valide.");
			return;
		}

		if (cleanName.length < 2) {
			alert("Le prénom doit faire au moins 2 caractères.");
			return;
		}

		const existingName = localStorage.getItem("userName");
		if (existingName && typeof existingName !== "string") {
			console.warn("Nom corrompu détecté dans le localStorage.");
			localStorage.removeItem("userName");
		}

		localStorage.setItem("userName", cleanName);
		window.location.href = "calendrier.html";
	});
}

// Fonction pour nettoyer et formater le nom
function sanitizeName(name) {
	const tempDiv = document.createElement("div");
	tempDiv.textContent = name;
	const textOnly = tempDiv.textContent.trim();

	const safeName = textOnly
		.replace(/[^a-zA-ZÀ-ÿ'\-\s]/g, "")
		.replace(/\s+/g, " ");

	return safeName
		.toLowerCase()
		.split(" ")
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

// Gestion du calendrier
const header = document.querySelector(".calendar h3");
const dates = document.querySelector(".dates");
const navs = document.querySelectorAll("#prev, #next");
const validateBtn = document.querySelector("#validate-dates");
if (validateBtn) validateBtn.disabled = true;

// Désactivation du bouton de validation et du trigger
const trigger = document.querySelector("#trigger");
if (trigger) trigger.disabled = true;

// Désactivation du label de validation
const validateLabel = document.querySelector(".validate-button");
// Si le label de validation existe, on le désactive
if (validateLabel) {
	validateLabel.style.opacity = 0.5;
	validateLabel.style.cursor = "not-allowed";
}

const output = document.querySelector("#output");

const months = [
	"Janvier",
	"Février",
	"Mars",
	"Avril",
	"Mai",
	"Juin",
	"Juillet",
	"Août",
	"Septembre",
	"Octobre",
	"Novembre",
	"Décembre",
];

let date = new Date();
let month = date.getMonth();
let year = date.getFullYear();
let selectedDates = [];
let isRedirecting = false;

// Fonction pour mettre à jour le bouton de validation
function updateValidateButton() {
	const active = selectedDates.length > 0;
	if (trigger) trigger.disabled = !active;
	if (validateBtn) validateBtn.disabled = !active;
	if (validateLabel) {
		validateLabel.style.opacity = active ? 1 : 0.5;
		validateLabel.style.cursor = active ? "pointer" : "not-allowed";
	}
}

// Fonction pour ajouter un zéro devant les nombres inférieurs à 10
const pad = (num) => num.toString().padStart(2, "0");

// Chargement des dates sélectionnées depuis le localStorage
const storedDates = localStorage.getItem("selectedDates");
if (storedDates) {
	selectedDates = JSON.parse(storedDates);
	updateValidateButton();
}

const today = new Date();
today.setHours(0, 0, 0, 0);

function animateMonthChange(callback) {
	dates.classList.add("fade-out");
	setTimeout(() => {
		callback();
		dates.classList.remove("fade-out");
		dates.classList.add("fade-in");
		setTimeout(() => dates.classList.remove("fade-in"), 300);
	}, 300);
}

const datesList = document.getElementById("dates-list");
// Vérification de l'existence de la liste des dates
if (datesList && selectedDates.length > 0) {
	selectedDates.forEach((dateStr) => {
		const [year, month, day] = dateStr.split("-");
		const formattedDate = `${pad(day)}/${pad(month)}/${year}`;

		const li = document.createElement("li");
		li.textContent = formattedDate;
		datesList.appendChild(li);
	});
}

// Fonction pour rendre les mois et les jours du calendrier
function renderCalendar() {
	const firstDayIndex = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const lastDayIndex = new Date(year, month, daysInMonth).getDay();
	const daysInPrevMonth = new Date(year, month, 0).getDate();

	let datesHtml = "";

	// Affichage des jours du mois précédent
	let startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
	for (let i = startDay; i > 0; i--) {
		datesHtml += `<li class="inactive">${daysInPrevMonth - i + 1}</li>`;
	}

	// Affichage des jours du mois courant
	for (let i = 1; i <= daysInMonth; i++) {
		let currentDate = new Date(year, month, i);
		let classes = [];

		// Vérification si la date est aujourd'hui
		if (currentDate.getTime() === today.getTime()) {
			classes.push("today");
		}

		// Vérification si la date est dans le passé
		let isPastDate = currentDate < today;
		let key = `${year}-${pad(month + 1)}-${pad(i)}`;

		// Ajout de la classe inactive si la date est dans le passé
		if (isPastDate) {
			classes.push("inactive");
		} else if (selectedDates.includes(key)) {
			classes.push("selected");
		}

		// Ajout de la classe pour les dates sélectionnées
		datesHtml += `<li class="${classes.join(" ")}" data-day="${i}">${i}</li>`;
	}

	let endDay = lastDayIndex === 0 ? 6 : lastDayIndex - 1;
	for (let i = 1; i < 7 - endDay; i++) {
		datesHtml += `<li class="inactive">${i}</li>`;
	}

	dates.innerHTML = datesHtml;
	header.textContent = `${months[month]} ${year}`;

	addDateClickHandlers();

	const prevBtn = document.querySelector("#prev");
	const firstDisplayedDate = new Date(year, month, 1);
	firstDisplayedDate.setHours(0, 0, 0, 0);

	// Désactivation du bouton "Précédent" si la date affichée est aujourd'hui ou avant
	if (firstDisplayedDate <= today) {
		prevBtn.disabled = true;
		prevBtn.classList.add("disabled");
	} else {
		prevBtn.disabled = false;
		prevBtn.classList.remove("disabled");
	}
}

// Ajout des gestionnaires d'événements pour les dates
function addDateClickHandlers() {
	document.querySelectorAll(".dates li:not(.inactive)").forEach((li) => {
		li.addEventListener("click", () => {
			const day = pad(li.dataset.day);
			const key = `${year}-${pad(month + 1)}-${day}`;

			if (selectedDates.includes(key)) {
				selectedDates = selectedDates.filter((d) => d !== key);
				li.classList.remove("selected");
			} else {
				selectedDates.push(key);
				li.classList.add("selected");
			}

			localStorage.setItem("selectedDates", JSON.stringify(selectedDates));
			updateValidateButton();
		});
	});
}

function saveDatesForUser(userName, dates) {
	const raw = localStorage.getItem("votesByDate") || "{}";
	const votes = JSON.parse(raw);

	dates.forEach((date) => {
		if (!votes[date]) votes[date] = [];
		if (!votes[date].includes(userName)) {
			votes[date].push(userName);
		}
	});

	localStorage.setItem("votesByDate", JSON.stringify(votes));
}

// Gestion des boutons de navigation
navs.forEach((nav) => {
	nav.addEventListener("click", (e) => {
		if (e.target.disabled) return;

		if (e.target.id === "prev") {
			month--;
			if (month < 0) {
				month = 11;
				year--;
			}
		} else if (e.target.id === "next") {
			month++;
			if (month > 11) {
				month = 0;
				year++;
			}
		}

		animateMonthChange(renderCalendar);
	});
});

// Gestion du bouton de validation
validateBtn?.addEventListener("click", () => {
	if (isRedirecting) return;
	if (selectedDates.length === 0) {
		output.textContent = "Aucune date sélectionnée !";
		return;
	}

	isRedirecting = true;

	validateBtn.disabled = true;
	validateBtn.style.cursor = "not-allowed";

	validateLabel.style.pointerEvents = "none";
	validateLabel.style.cursor = "not-allowed";

	output.textContent = selectedDates.length + " Dates sélectionnées : ";

	const existingName = localStorage.getItem("userName") || "";
	const dataToSend = {
		userName: existingName,
		selectedDates: selectedDates,
	};

	const userName = localStorage.getItem("userName");
	saveDatesForUser(userName, selectedDates);

	fetch(`${BASE_URL}/submit-dates`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(dataToSend),
	})
		.then((response) => {
			if (!response.ok) throw new Error("Erreur lors de l'envoi");
			return response.json();
		})
		.then((result) => {
			console.log("Données envoyées avec succès :", result);
			output.textContent = "Chargement des statistiques...";

			localStorage.setItem("selectedDates", JSON.stringify(selectedDates));

			return fetch(`${BASE_URL}/votes`);
		})
		.then((res) => {
			if (!res.ok) throw new Error("Erreur lors du chargement des données");
			return res.json();
		})
		.then((data) => {
			// ✅ Utilisation directe des dates populaires depuis le backend
			const popularDates = data[0]?.popularDates || [];

			localStorage.setItem("popularDates", JSON.stringify(popularDates));

			output.textContent = "Redirection en cours...";
			setTimeout(() => {
				window.location.href = "confirmation/confirmation.html";
			}, 1000);
		})
		.catch((err) => {
			console.error("Erreur lors de la communication avec le serveur :", err);
			output.textContent =
				"Erreur lors de la communication avec le serveur. Veuillez réessayer.";

			validateBtn.disabled = false;
			validateBtn.style.cursor = "pointer";

			validateLabel.style.pointerEvents = "auto";
			validateLabel.style.cursor = "pointer";

			isRedirecting = false;
		});
});

// Vérification des dates déjà enregistrées
if (storedDates) {
	output.textContent = "Dates déjà enregistrées.";
}

renderCalendar();

// Ajout de l'écouteur d'événement pour le label du trigger
const triggerLabel = document.querySelector("label[for='trigger']");
if (triggerLabel) {
	triggerLabel.addEventListener("click", () => {
		console.log("Bouton cliqué");
		validateBtn.click();
	});
}
