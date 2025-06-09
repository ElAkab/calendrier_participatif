console.log("JS chargé");

const BASE_URL = window.location.hostname.includes("test-modifs") // ou une autre partie de l’URL Netlify de test
	? "https://calendrier-participatif-backend-test.onrender.com"
	: window.location.hostname === "localhost"
	? "http://localhost:3000"
	: "https://calendrier-participatif-backend.onrender.com";

function safeParseJSON(raw) {
	try {
		return JSON.parse(raw) || [];
	} catch {
		return [];
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const modal = document.getElementById("welcomeModal");
	const talkingWheel = document.querySelector(".talking-wheel");
	const p = document.querySelector("#welcomeModal p");
	const input = document.getElementById("userNameInput");
	const btn = document.getElementById("submitNameBtn");
	const nameMessage = document.getElementById("nameMessage");
	const resetBtn = document.getElementById("resetNamesBtn");
	let lastPlaceholder = null;

	function togglePageInteraction(disabled) {
		document.body.style.pointerEvents = disabled ? "none" : "auto";
		document.body.style.opacity = disabled ? "0.6" : "1";
	}

	function showLoader(show) {
		const loader = document.getElementById("loader");
		if (loader) loader.style.display = show ? "block" : "none";
	}

	// Liste autorisée
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

	const allUsedNames = getAllNames().map((n) => n.toLowerCase());
	const availableUsers = users.filter((user) =>
		user.names.every((name) => !allUsedNames.includes(name.toLowerCase()))
	);

	function getAllNames() {
		const raw = localStorage.getItem("allUserNames");
		return raw ? JSON.parse(raw) : [];
	}

	if (!modal || !input || !btn || !nameMessage || !resetBtn) return;

	const userName = localStorage.getItem("userName");

	// Étape 1 – Vérifier si l'utilisateur existe toujours côté serveur
	if (userName) {
		fetch(`${BASE_URL}/is-name-taken`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: userName }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (!data.isTaken) {
					console.warn(
						`👻 L'utilisateur ${userName} n'existe plus côté serveur. Réinitialisation.`
					);
					localStorage.removeItem("userName");
					localStorage.removeItem("selectedDates");
					localStorage.removeItem("allUserNames");
					localStorage.removeItem("calendarMonth");
					localStorage.removeItem("calendarYear");
					location.reload();
				}
			})
			.catch((err) => {
				console.error("Erreur lors de la vérification du nom :", err);
			});
	}

	// Étape 2 – Modal : affichage ou non selon présence du nom
	if (userName) {
		modal.classList.remove("active");
		console.log(`Prénom déjà stocké : ${userName}`);
	} else {
		modal.classList.add("active");
		if (availableUsers.length > 0) {
			let randomUser;
			do {
				randomUser =
					availableUsers[Math.floor(Math.random() * availableUsers.length)];
			} while (
				availableUsers.length > 1 &&
				randomUser.placeholder === lastPlaceholder
			);

			input.placeholder = randomUser.placeholder;
			lastPlaceholder = randomUser.placeholder;
		} else {
			input.placeholder = "C'est toi ?";
			lastPlaceholder = "C'est toi ?";
		}
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

	btn.addEventListener("click", async () => {
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

		// Ajout animation + désactivation
		setTimeout(() => {
			talkingWheel.style.opacity = "1"; // ça déclenche la transition CSS
			setTimeout(() => {
				talkingWheel.classList.add("spin"); // start animation après la transition
			}, 310); // un tout petit plus que 300ms pour être sûr
		}, 0);

		p.textContent = `Vérification`;
		input.disabled = true;
		btn.disabled = true;

		try {
			// Vérifie si le prénom est déjà pris
			const responseIsTaken = await fetch(`${BASE_URL}/is-name-taken`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});

			if (!responseIsTaken.ok) throw new Error("Erreur réseau");

			const dataIsTaken = await responseIsTaken.json();

			if (dataIsTaken.isTaken) {
				alert("Ce prénom a déjà été utilisé.");
				p.textContent = `Entre ton prénom`;
				nameMessage.textContent = "Ce prénom a déjà été utilisé.";
				input.classList.add("invalid");
				return;
			}

			// Enregistrement du prénom dans la BDD (Neon)
			const responseRegister = await fetch(`${BASE_URL}/register-user`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});

			if (!responseRegister.ok) {
				const errorData = await responseRegister.json();
				throw new Error(
					errorData.error || "Erreur serveur lors de l'enregistrement"
				);
			}

			// Sauvegarde en local (localStorage + fonction perso si besoin)
			localStorage.setItem("userName", name);
			saveName(name); // si cette fonction existe bien

			// Fermeture de la modale + feedback
			modal.classList.remove("active");
			alert(`Bienvenue, ${name} ! 🎉`);
			console.log(`On dirait bien que c'est, ${name} 😱 !`);
		} catch (err) {
			console.error("Erreur lors du traitement du prénom :", err);
			nameMessage.textContent = "Erreur serveur. Réessaie plus tard.";
			input.classList.add("invalid");
		} finally {
			talkingWheel.classList.remove("spin");
			btn.disabled = false;
			input.disabled = false;
			input.focus();
		}
	});

	input.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			btn.click();
		}
	});

	resetBtn.addEventListener("click", async () => {
		if (
			!confirm(
				"Cette action supprimera toutes les données (prénom et dates), idéal pour recommencer 🤔.. \n\nT'es sûr ?"
			)
		) {
			return;
		}

		togglePageInteraction(true);
		showLoader(true);

		const userName = localStorage.getItem("userName");

		if (userName) {
			try {
				console.log("Tentative suppression de :", userName);
				const res = await fetch(
					`${BASE_URL}/delete-user/${encodeURIComponent(userName)}`,
					{
						method: "DELETE",
					}
				);

				if (!res.ok) throw new Error("Erreur serveur");

				console.log(`Utilisateur ${userName} supprimé du serveur.`);
			} catch (err) {
				console.error("Erreur lors de la suppression côté serveur :", err);
				alert(
					"Impossible de supprimer les données serveur. Réessaie plus tard."
				);

				togglePageInteraction(false);
				showLoader(false);
				return;
			}
		}

		localStorage.removeItem("allUserNames");
		localStorage.removeItem("userName");
		localStorage.removeItem("selectedDates");
		localStorage.removeItem("calendarMonth");
		localStorage.removeItem("calendarYear");

		// Affiche le loader un court instant avant de faire quoi que ce soit
		setTimeout(() => {
			modal.classList.add("active");
			input.value = "";
			input.classList.remove("invalid");
			nameMessage.textContent = "";

			const allSelected = document.querySelectorAll(".selected");
			allSelected.forEach((el) => el.classList.remove("selected"));

			const output = document.querySelector("#output");
			if (output) output.textContent = "";
		}, 100); // délai court pour laisser le temps au loader d'apparaître

		// Recharge la page après une courte pause (optionnel, laisse le temps au loader de s'afficher visuellement)
		setTimeout(() => {
			location.reload();
		}, 10);
	});
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

const VACANCES_2025 = [
	{
		nom: "Vacances d'hiver (Noël)",
		debut: "2024-12-21",
		fin: "2025-01-04",
	},
	{
		nom: "Vacances de Carnaval",
		debut: "2025-02-24",
		fin: "2025-03-09",
	},
	{
		nom: "Vacances de printemps (Pâques)",
		debut: "2025-04-28",
		fin: "2025-05-11",
	},
	{
		nom: "Vacances d'été",
		debut: "2025-07-04",
		fin: "2025-08-24",
	},
];

const VACANCES_2026 = [
	{
		nom: "Vacances d'hiver (Noël)",
		debut: "2025-12-27",
		fin: "2026-01-01",
	},
	{
		nom: "Vacances de Carnaval",
		debut: "2026-02-16",
		fin: "2026-03-01",
	},
	{
		nom: "Vacances de printemps (Pâques)",
		debut: "2026-04-25",
		fin: "2026-05-10",
	},
	{
		nom: "Vacances d'été",
		debut: "2026-07-04",
		fin: "2026-08-24",
	},
];

const VACANCES_2027 = [
	{
		nom: "Vacances d'hiver (Noël)",
		debut: "2026-12-27",
		fin: "2027-01-03",
	},
	{
		nom: "Vacances de Carnaval",
		debut: "2027-02-15",
		fin: "2027-02-21",
	},
	{
		nom: "Vacances de printemps (Pâques)",
		debut: "2027-04-03",
		fin: "2027-04-18",
	},
	{
		nom: "Vacances d'été",
		debut: "2027-07-03",
		fin: "2027-08-29",
	},
];

const VACANCES_2028 = [
	{
		nom: "Vacances d'hiver (Noël)",
		debut: "2027-12-25",
		fin: "2028-01-02",
	},
	{
		nom: "Vacances de Carnaval",
		debut: "2028-02-26",
		fin: "2028-03-05",
	},
	{
		nom: "Vacances de printemps (Pâques)",
		debut: "2028-03-25",
		fin: "2028-04-09",
	},
	{
		nom: "Vacances d'été",
		debut: "2028-07-01",
		fin: "2028-08-28",
	},
];

const VACANCES_COLORS = {
	"Vacances d'hiver (Noël)": "#1E90FF", // Bleu
	"Vacances de Carnaval": "#800080", // Rose
	"Vacances de printemps (Pâques)": "#32CD32", // Vert
	"Vacances d'été": "#FFA500", // Orange
};

let date = new Date();
let month = date.getMonth();
let year = date.getFullYear();
let selectedDates = [];
let isRedirecting = false;

// Récupérer mois et année sauvegardés (une seule fois)
const savedMonth = localStorage.getItem("calendarMonth");
const savedYear = localStorage.getItem("calendarYear");

if (savedMonth !== null && savedYear !== null) {
	month = parseInt(savedMonth, 10);
	year = parseInt(savedYear, 10);
}

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

function updateVacancesStyle(color) {
	const styleId = "vacances-dynamic-style";
	let styleTag = document.getElementById(styleId);

	if (!styleTag) {
		styleTag = document.createElement("style");
		styleTag.id = styleId;
		document.head.appendChild(styleTag);
	}

	styleTag.textContent = `
		.vacances {
			background: linear-gradient(135deg, ${color}10, ${color}30);
			border-radius: 0 !important;
			box-shadow: 0 1px 3px ${color}40;
			transition: transform 0.2s ease, box-shadow 0.2s ease;
			position: relative;
		}

		.vacances:active {
			background: ${color}30;
			color: #ffffff;
		}

		.selected.vacances {
			background: linear-gradient(135deg, ${color}20, ${color});
			color: #ffffff;
			box-shadow: 0 0 8px ${color}66;
			position: relative;
		}
	`;
}

function normalizeDate(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getVacanceForDate(date) {
	const allVacances = [
		...VACANCES_2025,
		...VACANCES_2026,
		...VACANCES_2027,
		...VACANCES_2028,
	];

	for (const vacance of allVacances) {
		const debut = new Date(vacance.debut);
		const fin = new Date(vacance.fin);

		debut.setHours(0, 0, 0, 0);
		fin.setHours(0, 0, 0, 0);

		if (date >= debut && date <= fin) {
			return vacance;
		}
	}
	return null;
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

function updateHolidayName() {
	const holidayTitle = document.querySelector(".holiday-name");
	const holidayDivider = document.querySelector(".holiday-divider");

	const allVacances = [
		...VACANCES_2025,
		...VACANCES_2026,
		...VACANCES_2027,
		...VACANCES_2028,
	];

	let matchingHolidays = [];

	allVacances.forEach((vacance) => {
		const start = new Date(vacance.debut);
		const end = new Date(vacance.fin);
		const monthStart = new Date(year, month, 1);
		const monthEnd = new Date(year, month + 1, 0);

		if (monthEnd >= start && monthStart <= end) {
			matchingHolidays.push(vacance.nom);
		}
	});

	if (holidayTitle && holidayDivider) {
		if (matchingHolidays.length > 0) {
			holidayDivider.style.display = "block";

			if (matchingHolidays.length === 1) {
				holidayTitle.textContent = matchingHolidays[0];
				holidayTitle.style.color =
					VACANCES_COLORS[matchingHolidays[0]] || "#000";
				holidayTitle.style.opacity = 1;
				holidayTitle.style.whiteSpace = "normal";
			} else {
				// Plusieurs vacances => un div par nom avec sa couleur propre
				holidayTitle.innerHTML = matchingHolidays
					.map(
						(name, index) =>
							`<div style="color:${VACANCES_COLORS[name] || "#000"};opacity:${
								index === 0 ? 1 : 0.5
							};white-space: normal;">${name}</div>`
					)
					.join("");
			}
		} else {
			holidayDivider.style.display = "none";
			holidayTitle.textContent = "";
			holidayTitle.style.opacity = 0.4;
			holidayTitle.style.color = "#000";
		}
	}

	// Ici, tu passes la couleur du premier titre pour la mise en forme des vacances dans le calendrier
	const firstHolidayName = matchingHolidays[0];
	const color = VACANCES_COLORS[firstHolidayName] || "#50C878";
	updateVacancesStyle(color);
}

function isDateInVacation(date, vacances) {
	for (const vac of vacances) {
		const debut = new Date(vac.debut);
		const fin = new Date(vac.fin);

		// Normalisation
		debut.setHours(0, 0, 0, 0);
		fin.setHours(0, 0, 0, 0);

		if (date >= debut && date <= fin) {
			return true;
		}
	}
	return false;
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
		currentDate.setHours(0, 0, 0, 0); // Important pour la comparaison

		let classes = [];

		if (currentDate.getTime() === today.getTime()) {
			classes.push("today");
		}

		let isPastDate = currentDate < today;
		let key = `${year}-${pad(month + 1)}-${pad(i)}`;

		if (isPastDate) {
			classes.push("inactive");
		} else if (selectedDates.includes(key)) {
			classes.push("selected");
		}

		const vacance = getVacanceForDate(currentDate);
		let styleAttr = "";

		if (vacance) {
			const vacName = vacance.nom.toLowerCase().replace(/\s+/g, "-");
			classes.push(`vacances-${vacName}`);

			const color = VACANCES_COLORS[vacance.nom] || "#50C878";

			// Couleur appliquée en inline : effet de vacances
			styleAttr = `style="
		background: linear-gradient(135deg, ${color}10, ${color}30);
		box-shadow: 0 1px 3px ${color}40;
		border-radius: 0;
	"`;
		}

		datesHtml += `<li class="${classes.join(
			" "
		)}" data-day="${i}" ${styleAttr}>${i}</li>`;
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

	updateHolidayName();
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

function isDateInVacances(date) {
	const allVacances = [
		...VACANCES_2025,
		...VACANCES_2026,
		...VACANCES_2027,
		...VACANCES_2028,
	];
	for (const vac of allVacances) {
		const start = new Date(vac.debut);
		const end = new Date(vac.fin);
		if (date >= start && date <= end) {
			return true;
		}
	}
	return false;
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

		// Enregistrer la position actuelle dans le localStorage
		localStorage.setItem("calendarMonth", month);
		localStorage.setItem("calendarYear", year);

		animateMonthChange(renderCalendar);
	});
});

// Gestion du bouton de validation
validateBtn?.addEventListener("click", () => {
	if (isRedirecting) return;

	// 🔄 Recharge les dates sélectionnées depuis localStorage
	const stored = localStorage.getItem("selectedDates");
	if (stored) selectedDates = JSON.parse(stored);

	// ✅ Vérifie les dates après mise à jour
	if (selectedDates.length === 0) {
		output.textContent = "Aucune date sélectionnée !";
		return;
	}

	const userName = localStorage.getItem("userName");

	if (!userName) {
		output.textContent = "Erreur : prénom non enregistré.";
		alert("Tu dois d'abord entrer ton prénom !");
		return;
	}

	isRedirecting = true;

	validateBtn.disabled = true;
	validateBtn.style.cursor = "not-allowed";

	validateLabel.style.pointerEvents = "none";
	validateLabel.style.cursor = "not-allowed";

	output.textContent = selectedDates.length + " Dates sélectionnées : ";

	const dataToSend = {
		userName: userName,
		selectedDates: selectedDates,
	};

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
				"Erreur lors de la communication avec le serveur. Je répare ça le plus vite possible !.";

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
