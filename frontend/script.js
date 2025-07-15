// 🔄 Role toggle
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

// 🚪 Login handler
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
        window.location.href = role === 'client' ? 'client_dashboard.html' : 'provider_dashboard.html';
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  });
}

// ✍️ Signup handler
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  if (signupForm && document.title.includes('Sign Up')) {
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
          window.location.href = role === 'client' ? 'client_dashboard.html' : 'provider_dashboard.html';
        } else {
          alert(data.message || 'Signup failed');
        }
      } catch (err) {
        console.error(err);
        alert('Server error');
      }
    });
  }
});

// 📅 Load appointments and notifications
async function loadAppointments() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  if (!userId || !role) return window.location.href = 'login.html';

  try {
    const res = await fetch(`/api/appointments/${userId}?role=${role}`);
    const appointments = await res.json();

    const appointmentsContainer = document.getElementById('appointmentsList');
    const calendarEl = document.getElementById('calendar');
    const notificationsEl = document.getElementById('notificationsList');

    appointmentsContainer.innerHTML = appointments.length
      ? ''
      : '<p>No upcoming appointments.</p>';

    const formatDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const formatTime = (timeStr) => {
      return timeStr.replace(':', '.').slice(0, 5);
    };

    appointments.forEach(app => {
      const item = document.createElement('div');
      item.className = 'appointment-item';

      const dateFormatted = formatDate(app.appointment_date);
      const timeFormatted = formatTime(app.appointment_time);
      const contextText = role === 'provider' ? app.client_name : app.specialization;

      item.innerHTML = `<p>📅 ${dateFormatted} at 🕑 ${timeFormatted}</p><p>👤 ${contextText}</p>`;
      appointmentsContainer.appendChild(item);

      if (notificationsEl) {
        const li = document.createElement('li');
        li.textContent = `🕒 ${dateFormatted} at ${timeFormatted} with ${contextText}`;
        notificationsEl.appendChild(li);
      }
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: appointments.map(app => ({
        title: role === 'provider' ? app.client_name : app.specialization,
        start: `${app.appointment_date}T${app.appointment_time}`,
        color: '#4a90e2',
      })),
    });

    calendar.render();
  } catch (err) {
    console.error('Failed to load appointments:', err);
  }
}

// 🔓 Logout dialog
function confirmLogout() {
  document.getElementById('logoutConfirmDialog')?.showModal();
}
function confirmLogoutYes() {
  localStorage.clear();
  window.location.href = 'login.html';
}
function confirmLogoutNo() {
  document.getElementById('logoutConfirmDialog')?.close();
}

// 👤 Profile load + save
async function openClientProfileDialog() {
  const userId = localStorage.getItem('userId');
  try {
    const res = await fetch(`/api/user/${userId}`);
    const data = await res.json();

    document.getElementById('clientName').value = data.name || '';
    document.getElementById('clientEmail').value = data.email || '';
    document.getElementById('clientPhone').value = data.phone || '';
    document.getElementById('profileDialog').showModal();
  } catch (err) {
    alert('Failed to load profile');
  }
}

async function saveClientProfile() {
  const userId = localStorage.getItem('userId');
  const name = document.getElementById('clientName').value.trim();
  const email = document.getElementById('clientEmail').value.trim();
  const phone = document.getElementById('clientPhone').value.trim();

  const confirmed = await showCustomConfirm('Are you sure you want to update your profile?');
  if (!confirmed) return;

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
    alert('Failed to save profile');
  }
}

// 🧠 Custom confirmation dialog
function showCustomConfirm(message) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = `
      <form method="dialog">
        <p>${message}</p>
        <menu>
          <button value="no">No</button>
          <button value="yes" autofocus>Yes</button>
        </menu>
      </form>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'yes');
      dialog.remove();
    });
    dialog.showModal();
  });
}

// 👋 Update dashboard header
async function updateDashboardHeader() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  if (!userId) return;

  try {
    const res = await fetch(`/api/user/${userId}`);
    const user = await res.json();
    const header = document.getElementById('dashboardTitle');
    if (header) header.textContent = `Welcome, ${user.name} ${role === 'provider' ? '👩‍⚕️' : '🙂'}`;
  } catch (err) {
    console.error('Header update failed', err);
  }
}

// ✅ Init dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (document.title.includes('Login')) handleLogin();
  if (document.title.includes('Dashboard')) {
    loadAppointments();
    updateDashboardHeader();
  }
});
