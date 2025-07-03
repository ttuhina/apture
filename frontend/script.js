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
function logout() {
  alert("Logged out!");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const isProviderPage = document.title.includes("Provider");

  if (isProviderPage) {
    const appointments = [
      {
        client: "Meera Sharma",
        date: "2025-07-02",
        time: "10:00 AM",
        service: "Dental Cleaning"
      },
      {
        client: "Rohit Verma",
        date: "2025-07-02",
        time: "12:00 PM",
        service: "Root Canal"
      }
    ];

    const list = document.getElementById("appointmentsList");

    appointments.forEach(app => {
      const div = document.createElement("div");
      div.className = "appointment-card";
      div.innerHTML = `
        <div>
          <strong>${app.client}</strong><br/>
          ${app.date} at ${app.time}<br/>
          🛠 ${app.service}
        </div>
        <div>
          <button onclick="reschedule()">Reschedule</button>
          <button onclick="cancel()">Cancel</button>
        </div>
      `;
      list.appendChild(div);
    });
  }
});

function reschedule() {
  alert("Redirecting to reschedule page...");
  // location.href = "/provider-reschedule.html";
}

function cancel() {
  alert("Appointment cancelled (mock)");
}

// script.js
async function loadAppointments() {
  const clientId = 2; // Replace with actual logged-in user ID (e.g., from session/localStorage)
  const res = await fetch(`/api/appointments/${clientId}`);
  const appointments = await res.json();

  const list = document.getElementById("appointmentsList");
  list.innerHTML = '';

  appointments.forEach(app => {
    const div = document.createElement('div');
    div.className = 'appointment-card';
    div.innerHTML = `
      <strong>${app.specialization}</strong><br/>
      Date: ${app.appointment_date}<br/>
      Time: ${app.appointment_time}
    `;
    list.appendChild(div);
  });
}

function logout() {
  alert('Logging out...');
  window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', loadAppointments);
// script.js

ffunction toggleRole() {
  const toggle = document.getElementById('roleToggle');
  const roleText = document.getElementById('roleText');
  const roleInput = document.getElementById('roleInput');

  if (toggle.checked) {
    roleText.textContent = 'Client';
    roleInput.value = 'client';
  } else {
    roleText.textContent = 'Provider';
    roleInput.value = 'provider';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const role = document.getElementById('roleInput').value;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ Login success → redirect based on role
        if (role === 'client') {
          window.location.href = 'client_dashboard.html';
        } else {
          window.location.href = 'provider_dashboard.html';
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error. Try again later.');
    }
  });
});


// 🔐 Handle login submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('input[type="password"]').value;
    const role = document.getElementById('roleInput').value;

    // 🔄 Dummy check (replace this with real API validation later)
    console.log('Logging in as:', role, email);

    if (role === 'client') {
      window.location.href = 'client_dashboard.html';
    } else if (role === 'provider') {
      window.location.href = 'provider_dashboard.html';
    }
  });
});
