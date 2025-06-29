function toggleRole() {
  const roleText = document.getElementById('roleText');
  const roleInput = document.getElementById('roleInput');
  const isClient = document.getElementById('roleToggle').checked;

  if (isClient) {
    roleText.textContent = "Client";
    roleInput.value = "client";
  } else {
    roleText.textContent = "Provider";
    roleInput.value = "provider";
  }
}
function logout() {
  // You can add JWT clearing or session logic here
  alert("Logged out!");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const appointments = [
    {
      provider: "Dr. Priya",
      date: "2025-07-02",
      time: "10:00 AM",
      location: "Smile Dental, Sector 12"
    },
    {
      provider: "Salon Aura",
      date: "2025-07-05",
      time: "5:30 PM",
      location: "Aura Salon, Green Park"
    }
  ];

  const list = document.getElementById("appointmentsList");

  appointments.forEach(app => {
    const div = document.createElement("div");
    div.className = "appointment-card";
    div.innerHTML = `
      <div>
        <strong>${app.provider}</strong><br/>
        ${app.date} at ${app.time}<br/>
        📍 ${app.location}
      </div>
      <div>
        <button onclick="reschedule()">Reschedule</button>
        <button onclick="cancel()">Cancel</button>
      </div>
    `;
    list.appendChild(div);
  });
});

function reschedule() {
  alert("Redirecting to reschedule page...");
  // location.href = "/reschedule.html";
}

function cancel() {
  alert("Appointment cancelled (mock)");
}

