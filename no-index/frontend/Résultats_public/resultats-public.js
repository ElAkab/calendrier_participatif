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
	const loader = document.getElementById("loader");

	const BASE_URL =
		window.location.hostname === "localhost" ||
		window.location.hostname === "127.0.0.1"
			? "http://localhost:3000"
			: "https://calendrier-participatif-public.onrender.com";

	// Exemple de plages avec leurs couleurs
	const DATE_RANGES = {
		"Vacances d'hiver": [["2024-12-24", "2025-01-05"]],
		"Vacances d'été": [["2025-07-05", "2025-08-24"]],
	};

	const DATE_COLORS = {
		"Vacances d'hiver": "#1E90FF",
		"Vacances d'été": "#FFA500",
	};

	function createDateLegend() {
		const legendContainer = document.getElementById("legend");
		if (!legendContainer) return;

		legendContainer.innerHTML = "";

		for (const [name, color] of Object.entries(DATE_COLORS)) {
			const legendItem = document.createElement("div");
			legendItem.classList.add("legend-item");

			legendItem.style.color = color;

			const colorBox = document.createElement("span");
			colorBox.classList.add("legend-circle");
			colorBox.style.backgroundColor = color;

			const label = document.createElement("span");
			label.textContent = name;

			legendItem.appendChild(colorBox);
			legendItem.appendChild(label);
			legendContainer.appendChild(legendItem);
		}
	}

	function isDateInRange(dateStr, startStr, endStr) {
		const date = new Date(dateStr);
		const start = new Date(startStr);
		const end = new Date(endStr);
		return date >= start && date <= end;
	}

	function getDateColor(dateStr) {
		for (const [rangeName, ranges] of Object.entries(DATE_RANGES)) {
			for (const [start, end] of ranges) {
				if (isDateInRange(dateStr, start, end)) {
					return DATE_COLORS[rangeName] || null;
				}
			}
		}
		return null;
	}

	function showMessage(text, duration = 3000) {
		messageContainer.textContent = text;
		messageContainer.classList.add("show");
		setTimeout(() => {
			messageContainer.classList.remove("show");
		}, duration);
	}

	let loaderInterval = null;

	function showLoader(message = "Chargement...") {
		let dotCount = 0;
		loader.style.display = "block";

		if (loaderInterval) clearInterval(loaderInterval);

		loaderInterval = setInterval(() => {
			dotCount = (dotCount + 1) % 4;
			let dots = ".".repeat(dotCount);
			loader.textContent = message + dots;
		}, 500);
	}

	function hideLoader() {
		loader.style.display = "none";
		if (loaderInterval) {
			clearInterval(loaderInterval);
			loaderInterval = null;
		}
		loader.textContent = "";
	}

	async function loadAndRenderData() {
		showLoader();

		try {
			const res = await fetch(`${BASE_URL}/votes`); // Remplace par ton endpoint
			if (!res.ok) throw new Error("Erreur serveur");

			const data = await res.json();
			hideLoader();

			if (!data || data.length === 0) {
				resultList.innerHTML =
					"<li style='text-align:center;'>Aucun résultat trouvé</li>";
				showMessage("Aucun résultat disponible.");
				return;
			}

			createDateLegend();
			renderResults(data);
		} catch (error) {
			hideLoader();
			showMessage("Une erreur est survenue.");
			console.error(error);
		}
	}

	function renderResults(data) {
		resultList.innerHTML = "";

		const dateCount = {};
		data.forEach((item) => {
			if (Array.isArray(item.dates)) {
				item.dates.forEach((date) => {
					dateCount[date] = (dateCount[date] || 0) + 1;
				});
			} else {
				console.warn("item.dates n'est pas un tableau :", item);
			}
		});

		const sortedDates = Object.entries(dateCount).sort((a, b) => b[1] - a[1]);

		sortedDates.forEach(([date, count]) => {
			const li = document.createElement("li");
			const color = getDateColor(date);

			li.textContent = `${date} - ${count} vote(s)`;
			if (color) {
				li.style.backgroundColor = color;
				li.style.color = "#fff";
				li.style.padding = "8px";
				li.style.borderRadius = "5px";
				li.style.marginBottom = "5px";
			}
			resultList.appendChild(li);
		});
	}

	loadAndRenderData();
});
