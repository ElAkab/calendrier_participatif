// backend/data/vacances.js
const VACANCES = {
	2025: [
		{ nom: "Vacances d'hiver (Noël)", debut: "2024-12-23", fin: "2025-01-05" },
		{
			nom: "Congé de détente (Carnaval)",
			debut: "2025-02-24",
			fin: "2025-03-09",
		},
		{
			nom: "Vacances de printemps (Pâques)",
			debut: "2025-04-28",
			fin: "2025-05-11",
		},
		{ nom: "Vacances d'été", debut: "2025-07-05", fin: "2025-08-24" },
	],
	2026: [
		{ nom: "Vacances d'hiver (Noël)", debut: "2025-12-22", fin: "2026-01-02" },
		{
			nom: "Vacances de détente (Carnaval)",
			debut: "2026-02-16",
			fin: "2026-02-27",
		},
		{
			nom: "Vacances de printemps (Pâques)",
			debut: "2026-04-27",
			fin: "2026-05-08",
		},
		{ nom: "Vacances d'été", debut: "2026-07-04", fin: "2026-08-24" },
	],
};

module.exports = VACANCES;
