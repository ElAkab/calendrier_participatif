const datesList = document.getElementById("datesList");
// Placer le nom de l'utilisateur dans le titre
const userName = localStorage.getItem("userName");
document.querySelector("h1").textContent = "Nickel " + userName + " !";

const savedDates = JSON.parse(localStorage.getItem("selectedDates")) || [];
const VACANCES = {
	"Vacances de Noël": [
		["2024-12-24", "2025-01-05"],
		["2025-12-22", "2026-01-04"],
		["2026-12-21", "2027-01-01"],
		["2027-12-25", "2028-01-02"],
	],
	"Vacances de Carnaval": [
		["2025-02-24", "2025-03-09"],
		["2026-02-16", "2026-02-28"],
		["2027-02-15", "2027-02-21"],
		["2028-02-25", "2028-03-05"],
	],
	"Vacances de Pâques": [
		["2025-04-28", "2025-05-11"],
		["2026-04-27", "2026-05-10"],
		["2027-04-05", "2027-04-18"],
		["2028-03-24", "2028-04-09"],
	],
	"Vacances d'été": [
		["2025-07-05", "2025-08-24"],
		["2026-07-04", "2026-08-24"],
		["2027-07-03", "2027-08-29"],
		["2028-07-01", "2028-08-28"],
	],
};

const VACANCES_COLORS = {
	"Vacances de Noël": "#1E90FF",
	"Vacances de Carnaval": "#800080",
	"Vacances de Pâques": "#32CD32",
	"Vacances d'été": "#FFA500",
};

// Affichage des dates sélectionnées
if (savedDates.length === 0) {
	datesList.innerHTML = "<li>Aucune date sélectionnée.</li>";
} else {
	// Affichage des dates formatées
	savedDates.forEach((date) => {
		const li = document.createElement("li");

		// Format d'affichage : jour/mois/année
		const [year, month, day] = date.split("-");
		const formattedDate = `${day}/${month}/${year}`;
		li.textContent = formattedDate;

		// Couleur si vacances
		const color = getVacationColorForDate(date);
		if (color) {
			li.style.background = color;
			li.style.color = "#fff";
		} else {
			li.style.color = "white"; // ou une autre couleur par défaut
		}

		datesList.appendChild(li);
	});
}

function getVacationColorForDate(dateString) {
	const current = normalizeDate(new Date(dateString)).getTime();
	for (const [name, ranges] of Object.entries(VACANCES)) {
		for (const [start, end] of ranges) {
			const from = normalizeDate(new Date(start)).getTime();
			const to = normalizeDate(new Date(end)).getTime();
			if (current >= from && current <= to) {
				return VACANCES_COLORS[name];
			}
		}
	}
	return null;
}

function normalizeDate(d) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getVacationColorForDate(dateString) {
	const current = normalizeDate(new Date(dateString));
	for (const [name, ranges] of Object.entries(VACANCES)) {
		for (const [start, end] of ranges) {
			const from = normalizeDate(new Date(start));
			const to = normalizeDate(new Date(end));
			if (current >= from && current <= to) {
				return VACANCES_COLORS[name];
			}
		}
	}
	return null;
}
