

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

// 🔓 Logout logic
function logout() {
  localStorage.clear();
  alert('Logged out');
  window.location.href = 'login.html';
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
      console.log('🛠 Login response:', data);

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


// 🧼 Optional: Logout confirmation
function confirmLogout() {
  const dialog = document.getElementById('logoutConfirmDialog');
  dialog.showModal();
}

function confirmLogoutYes() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function confirmLogoutNo() {
  document.getElementById('logoutConfirmDialog').close();
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
function openAvailabilityDialog() {
  document.getElementById('availabilityDialog').showModal();
}

function saveAvailability() {
  const workingHours = document.getElementById('workingHoursInput').value.trim();
  const userId = localStorage.getItem('userId');

  fetch(`/api/provider-profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ working_hours: workingHours })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Working hours updated');
      document.getElementById('availabilityDialog').close();
    })
    .catch(err => {
      console.error(err);
      alert('Error saving availability');
    });
}
// 🌐 Opens the profile dialog
async function openProfileDialog() {
  const userId = localStorage.getItem('userId');
  const dialog = document.getElementById('profileDialog');

  try {
    const res = await fetch(`/api/provider-profile/${userId}`);
    const data = await res.json();

    document.getElementById('profileName').value = data.name;
    document.getElementById('profileSpecialization').value = data.specialization;
    document.getElementById('profileLocation').value = data.location;
    document.getElementById('profileBio').value = data.bio;
    document.getElementById('profileWorkingHours').value = data.working_hours;

    dialog.showModal();
  } catch (err) {
    console.error('Failed to load profile:', err);
    alert('Error loading profile.');
  }
}

// 🌐 Confirm Logout Logic
function confirmLogout() {
  const dialog = document.getElementById('logoutConfirmDialog');
  dialog.showModal();
}

function confirmLogoutYes() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function confirmLogoutNo() {
  document.getElementById('logoutConfirmDialog').close();
}

document.addEventListener('DOMContentLoaded', () => {
  const pageTitle = document.title;
  const logoutBtn = document.querySelector('button[onclick="logout()"]');

  if (pageTitle.includes('Login')) {
    handleLogin();
  }

  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Load appointments on dashboard
  if (pageTitle.includes('Dashboard')) {
    loadAppointments();
    updateDashboardHeader(); // Call to update header name
  }
});
