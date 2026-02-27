// Base URL
const API_BASE_URL = 'http://localhost:3000';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  const userForm = document.getElementById('userForm');
  if (userForm) {
    userForm.addEventListener('submit', handleUserFormSubmit);
  }
});

async function handleUserFormSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    window.location.href = '/loginform/html/login.html';
    return;
  }

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const branch = document.getElementById('branch').value;
  const phone = document.getElementById('phone').value.trim();
  const bio = document.getElementById('bio').value.trim();

  // Basic validation
  if (!name || !email || !password || !role) {
    showMessage('Name, email, password and role are required', 'error');
    return;
  }

  const payload = { name, email, password, role };
  if (branch) payload.branch = branch;
  if (phone) payload.phone = phone;
  if (bio) payload.bio = bio;

  try {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.message || 'Failed to register user', 'error');
      console.error('Register error', data);
      return;
    }
    showMessage('User registered successfully', 'success');
    document.getElementById('userForm').reset();
  } catch (err) {
    console.error('Network error', err);
    showMessage('Network error while registering user', 'error');
  }
}

function showMessage(msg, type='info') {
  const container = document.getElementById('userMessage');
  container.textContent = msg;
  container.className = type === 'error' ? 'no-results error' : 'no-results success';
  container.style.display = 'flex';
  setTimeout(() => { container.style.display = 'none'; }, 4000);
}