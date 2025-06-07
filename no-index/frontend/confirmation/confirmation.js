const datesList = document.getElementById("datesList");
const savedDates = JSON.parse(localStorage.getItem("selectedDates")) || [];
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
	const current = normalizeDate(new Date(dateString));
	for (const [name, ranges] of Object.entries(VACANCES)) {
		for (const [start, end] of ranges) {
			const from = normalizeDate(new Date(start));
			const to = normalizeDate(new Date(end));
			// Log pour debug
			console.log(`${dateString} - checking ${name}: ${start} to ${end}`);
			if (current >= from && current <= to) {
				console.log(`Match found: ${dateString} is in ${name}`);
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
