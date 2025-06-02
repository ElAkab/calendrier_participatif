const datesList = document.getElementById("datesList");
const savedDates = JSON.parse(localStorage.getItem("selectedDates")) || [];

if (savedDates.length === 0) {
	datesList.innerHTML = "<li>Aucune date sélectionnée.</li>";
} else {
	savedDates.forEach((date) => {
		const li = document.createElement("li");
		// Split and format date: Jour/mois/année
		const dateParts = date.split("-");
		const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
		li.textContent = formattedDate;
		datesList.appendChild(li);
	});
}
