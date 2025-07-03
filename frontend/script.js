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

// 📥 Load appointments only if on a dashboard
async function loadAppointments() {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  if (!userId || !role) {
    alert('Session expired. Please login again.');
    window.location.href = 'login.html';
    return;
  }

  const appointmentsContainer = document.getElementById('appointmentsList');
  if (!appointmentsContainer) return; // Not on dashboard

  try {
    const res = await fetch(`/api/appointments/${userId}`);
    const appointments = await res.json();

    if (appointments.length === 0) {
      appointmentsContainer.innerHTML = '<p>No upcoming appointments.</p>';
      return;
    }

    appointmentsContainer.innerHTML = '';

    appointments.forEach(app => {
      const div = document.createElement('div');
      div.classList.add('appointment-item');
      div.innerHTML = `
        <p>📅 ${app.appointment_date} at 🕑 ${app.appointment_time}</p>
        <p>${role === 'client' ? '👩‍⚕️ ' : '🧑‍💼 '}${app.specialization || app.client_name}</p>
      `;
      appointmentsContainer.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading appointments:', err);
    appointmentsContainer.innerHTML = '<p>Error loading appointments.</p>';
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
      console.log('🛠 Login response:', data);

      if (res.ok) {
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('role', role);

        if (role === 'client') {
          window.location.href = 'client_dashboard.html';
        } else {
          window.location.href = 'provider_dashboard.html';
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Server error. Try again later.');
    }
  });
}

// 🧠 Run correct logic on correct page
document.addEventListener('DOMContentLoaded', () => {
  const pageTitle = document.title;

  if (pageTitle.includes('Login')) {
    handleLogin(); // only run login logic on login page
  }

  if (pageTitle.includes('Dashboard')) {
    loadAppointments(); // only load appointments on dashboard
  }
});
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

          // Redirect to correct dashboard
          if (role === 'client') {
            window.location.href = 'client_dashboard.html';
          } else {
            window.location.href = 'provider_dashboard.html';
          }
        } else {
          alert(data.message || 'Signup failed');
        }
      } catch (err) {
        console.error(err);
        alert('Server error. Try again later.');
      }
    });
  }
