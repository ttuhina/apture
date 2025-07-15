// 🔄 Role toggle handler
function toggleRole() {
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

// 🚪 Login handler (only on login.html)
async function handleLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

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
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('role', role);
        window.location.href =
          role === 'client' ? 'client_dashboard.html' : 'provider_dashboard.html';
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Server error. Try again later.');
    }
  });
}

// ✍️ Signup handler (only on signup.html)
const signupForm = document.getElementById('signupForm');
const isSignupPage = document.title.includes('Sign Up');

if (isSignupPage && signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const role = document.getElementById('roleInput').value;

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('role', role);
        window.location.href =
          role === 'client' ? 'client_dashboard.html' : 'provider_dashboard.html';
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error. Try again later.');
    }
  });
}

// 📥 Load appointments for client or provider
async function loadAppointments() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  if (!userId || !role) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
    return;
  }

  const appointmentsContainer = document.getElementById('appointmentsList');
  const calendarEl = document.getElementById('calendar');
  const notificationsEl = document.getElementById('notificationsList');

  if (!appointmentsContainer || !calendarEl) return;

  try {
    const res = await fetch(`/api/appointments/${userId}?role=${role}`);
    const appointments = await res.json();

    appointmentsContainer.innerHTML = '';
    if (appointments.length === 0) {
      appointmentsContainer.innerHTML = '<p>No upcoming appointments.</p>';
    } else {
      appointments.forEach(app => {
        const div = document.createElement('div');
        div.classList.add('appointment-item');
        div.innerHTML = `
          <p>📅 ${app.appointment_date} at 🕑 ${app.appointment_time}</p>
          <p>👤 ${role === 'provider' ? app.client_name : app.specialization}</p>
        `;
        appointmentsContainer.appendChild(div);
      });
    }

    if (notificationsEl) {
      notificationsEl.innerHTML = '';
      appointments.forEach(app => {
        const li = document.createElement('li');
        li.textContent = `🕒 Appointment on ${app.appointment_date} at ${app.appointment_time} with ${role === 'provider' ? app.client_name : app.specialization}`;
        notificationsEl.appendChild(li);
      });
    }

    const calendarEvents = appointments.map(app => ({
      title: role === 'provider' ? app.client_name : app.specialization || 'Appointment',
      start: `${app.appointment_date}T${app.appointment_time}`,
      color: '#4a90e2',
      allDay: false
    }));

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      timeZone: 'local',
      height: '100%',
      events: calendarEvents,
      headerToolbar: {
        left: 'prev,next',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      }
    });

    calendar.render();
  } catch (err) {
    console.error('❌ Error loading appointments:', err);
    appointmentsContainer.innerHTML = '<p>Error loading appointments.</p>';
  }
}

// 🔐 Logout confirmation dialog
function confirmLogout() {
  const dialog = document.getElementById('logoutConfirmDialog');
  if (dialog) dialog.showModal();
}

function confirmLogoutYes() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function confirmLogoutNo() {
  const dialog = document.getElementById('logoutConfirmDialog');
  if (dialog) dialog.close();
}

// 👤 Load and open client profile dialog
async function openClientProfileDialog() {
  const userId = localStorage.getItem('userId');
  if (!userId) return alert("Session expired. Login again.");

  try {
    const res = await fetch(`/api/user/${userId}`);
    const data = await res.json();

    document.getElementById('clientName').value = data.name || '';
    document.getElementById('clientEmail').value = data.email || '';
    document.getElementById('clientPhone').value = data.phone || '';
    document.getElementById('profileDialog').showModal();
  } catch (err) {
    console.error(err);
    alert('Failed to load profile');
  }
}

// ✏️ Save updated client profile
async function saveClientProfile() {
  const userId = localStorage.getItem('userId');
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();

  try {
    const res = await fetch(`/api/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone })
    });

    const data = await res.json();
    alert(data.message || 'Profile updated');
    document.getElementById('profileDialog').close();
  } catch (err) {
    console.error(err);
    alert('Failed to save profile');
  }
}

// 🧠 Dashboard header update
async function updateDashboardHeader() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  if (!userId || !role) return;

  try {
    const res = await fetch(`/api/user/${userId}`);
    const user = await res.json();

    const header = document.getElementById('dashboardTitle');
    if (header) {
      header.textContent = `Welcome, ${user.name} ${role === 'provider' ? '👩‍⚕️' : '🙂'}`;
    }
  } catch (err) {
    console.error('Failed to update header name', err);
  }
}

// 📅 Init dashboard logic
document.addEventListener('DOMContentLoaded', () => {
  const pageTitle = document.title;

  if (pageTitle.includes('Login')) {
    handleLogin();
  }

  if (pageTitle.includes('Dashboard')) {
    loadAppointments();
    updateDashboardHeader();
  }
});
