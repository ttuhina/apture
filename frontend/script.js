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

    appointments.forEach(app => {
      // Format date to DD/MM/YYYY
      const rawDate = new Date(app.appointment_date);
      const formattedDate = `${String(rawDate.getDate()).padStart(2, '0')}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${rawDate.getFullYear()}`;

      // Format time to HH.MM
      const timeParts = app.appointment_time.split(':');
      const formattedTime = `${timeParts[0]}.${timeParts[1]}`;

      const secondaryText = role === 'provider'
        ? app.client_name
        : `${app.provider_name} – ${app.specialization}`;

      const item = document.createElement('div');
      item.className = 'appointment-item';
      item.innerHTML = `<p>📅 ${formattedDate} at 🕑 ${formattedTime}</p><p>👤 ${secondaryText}</p>`;
      appointmentsContainer.appendChild(item);

      if (notificationsEl) {
        const li = document.createElement('li');
        li.textContent = `🕒 ${formattedDate} at ${formattedTime} with ${secondaryText}`;
        notificationsEl.appendChild(li);
      }
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      events: appointments.map(app => ({
        title: role === 'provider' ? app.client_name : `${app.provider_name} – ${app.specialization}`,
        start: `${app.appointment_date}T${app.appointment_time}`,
        color: '#4a90e2',
      })),
    });

    calendar.render();

    // Load appointment requests for providers
    if (role === 'provider') {
      loadAppointmentRequests();
    }
  } catch (err) {
    console.error('Failed to load appointments:', err);
  }
}

// 📋 Load appointment requests for providers
async function loadAppointmentRequests() {
  const userId = localStorage.getItem('userId');
  try {
    const res = await fetch(`/api/appointment-requests/provider/${userId}`);
    const requests = await res.json();

    const requestsContainer = document.getElementById('requestsList');
    if (!requestsContainer) return;

    requestsContainer.innerHTML = requests.length
      ? ''
      : '<p>No pending requests.</p>';

    requests.forEach(req => {
      const rawDate = new Date(req.requested_date);
      const formattedDate = `${String(rawDate.getDate()).padStart(2, '0')}/${String(rawDate.getMonth() + 1).padStart(2, '0')}/${rawDate.getFullYear()}`;
      const timeParts = req.requested_time.split(':');
      const formattedTime = `${timeParts[0]}.${timeParts[1]}`;

      const item = document.createElement('div');
      item.className = 'request-item';
      item.innerHTML = `
        <p>📅 ${formattedDate} at 🕑 ${formattedTime}</p>
        <p>👤 ${req.client_name}</p>
        <div class="request-actions">
          <button onclick="respondToRequest(${req.id}, true)" class="approve-btn">✅ Approve</button>
          <button onclick="respondToRequest(${req.id}, false)" class="reject-btn">❌ Reject</button>
        </div>
      `;
      requestsContainer.appendChild(item);
    });
  } catch (err) {
    console.error('Failed to load appointment requests:', err);
  }
}

// 📤 Respond to appointment request
async function respondToRequest(requestId, approve) {
  const confirmed = await showCustomConfirm(
    `Are you sure you want to ${approve ? 'approve' : 'reject'} this request?`
  );
  if (!confirmed) return;

  try {
    const res = await fetch('/api/appointment-requests/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, approve })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      loadAppointmentRequests(); // Refresh the requests list
      loadAppointments(); // Refresh appointments if approved
    } else {
      alert(data.message || 'Failed to respond to request');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
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

// 👤 Load & edit client profile
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

// 🏥 Provider profile functions
async function openProfileDialog() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  
  if (role === 'client') {
    openClientProfileDialog();
    return;
  }

  try {
    const res = await fetch(`/api/provider-profile/${userId}`);
    const data = await res.json();

    document.getElementById('providerName').value = data.name || '';
    document.getElementById('providerSpecialization').value = data.specialization || '';
    document.getElementById('providerLocation').value = data.location || '';
    document.getElementById('providerBio').value = data.bio || '';
    document.getElementById('providerWorkingHours').value = data.working_hours || '';
    document.getElementById('profileDialog').showModal();
  } catch (err) {
    alert('Failed to load profile');
  }
}

async function saveProviderProfile() {
  const userId = localStorage.getItem('userId');
  const name = document.getElementById('providerName').value.trim();
  const specialization = document.getElementById('providerSpecialization').value.trim();
  const location = document.getElementById('providerLocation').value.trim();
  const bio = document.getElementById('providerBio').value.trim();
  const working_hours = document.getElementById('providerWorkingHours').value.trim();

  const confirmed = await showCustomConfirm('Are you sure you want to update your profile?');
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/provider-profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, specialization, location, bio, working_hours })
    });
    const data = await res.json();
    alert(data.message || 'Profile updated');
    document.getElementById('profileDialog').close();
    updateDashboardHeader(); // Update header with new name
  } catch (err) {
    alert('Failed to save profile');
  }
}

// 📅 Availability functions
function openAvailabilityDialog() {
  document.getElementById('availabilityDialog').showModal();
}

async function saveAvailability() {
  const userId = localStorage.getItem('userId');
  const checkboxes = document.querySelectorAll('.days-selection input[type="checkbox"]:checked');
  const selectedDays = Array.from(checkboxes).map(cb => cb.value);
  
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const breakStart = document.getElementById('breakStart').value || null;
  const breakEnd = document.getElementById('breakEnd').value || null;

  if (selectedDays.length === 0) {
    alert('Please select at least one working day');
    return;
  }

  if (!startTime || !endTime) {
    alert('Please select start and end times');
    return;
  }

  const confirmed = await showCustomConfirm('Are you sure you want to save your availability?');
  if (!confirmed) return;

  try {
    const res = await fetch('/api/provider-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_user_id: userId,
        days: selectedDays,
        start: startTime,
        end: endTime,
        bs: breakStart,
        be: breakEnd
      })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Availability saved');
      document.getElementById('availabilityDialog').close();
      // Reset form
      document.querySelectorAll('.days-selection input[type="checkbox"]').forEach(cb => cb.checked = false);
      document.getElementById('startTime').value = '';
      document.getElementById('endTime').value = '';
      document.getElementById('breakStart').value = '';
      document.getElementById('breakEnd').value = '';
    } else {
      alert(data.message || 'Failed to save availability');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
}

// 💬 Custom confirmation dialog
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

// 👋 Update dashboard greeting
async function updateDashboardHeader() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  if (!userId) return;

  try {
    const res = await fetch(`/api/user/${userId}`);
    const user = await res.json();
    const header = document.getElementById('dashboardTitle');
    if (header) header.textContent = `Welcome, ${user.name} ${role === 'provider' ? '👩‍⚕️' : '👋'}`;
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