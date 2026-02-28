/**
 * addUser.js — Register a new user
 *
 * Submits the Add User form to POST /users/register.
 * On success, redirects back to the User Management list.
 */

'use strict';

const API_BASE = 'http://localhost:3000';

// ── Auth helper ───────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('token');
}

// ── Alert ─────────────────────────────────────────────────────────────────────

function showAlert(message, type) {
  var box = document.getElementById('alert-box');
  box.className   = 'au-alert ' + (type || 'error');
  box.textContent = message;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAlert() {
  var box = document.getElementById('alert-box');
  box.className   = 'au-alert hidden';
  box.textContent = '';
}

// ── Form submit ───────────────────────────────────────────────────────────────

async function handleSubmit(e) {
  e.preventDefault();
  clearAlert();

  var token = getToken();
  if (!token) {
    window.location.href = '/loginform/html/login.html';
    return;
  }

  var name     = document.getElementById('name').value.trim();
  var email    = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var phone    = document.getElementById('phone').value.trim();
  var role     = document.getElementById('role').value;
  var branch   = document.getElementById('branch').value;

  // Client-side validation
  if (!name || !email || !password || !role) {
    showAlert('Name, email, password and role are required.', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters.', 'error');
    return;
  }

  var payload = { name: name, email: email, password: password, role: role };
  if (branch) payload.branch = branch;
  if (phone)  payload.phone  = phone;

  var btn = document.getElementById('submit-btn');
  btn.disabled    = true;
  btn.textContent = 'Registering…';

  try {
    var res  = await fetch(API_BASE + '/users/register', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(payload)
    });
    var data = await res.json();

    if (!res.ok) {
      showAlert(data.message || 'Failed to register user.', 'error');
      return;
    }

    showAlert('User registered successfully! Redirecting…', 'success');
    setTimeout(function() {
      window.location.href = '/Dashbord forms/html/usermanagement.html';
    }, 1500);

  } catch {
    showAlert('Network error. Please check your connection.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Register User';
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  var token = getToken();
  if (!token) {
    window.location.href = '/loginform/html/login.html';
    return;
  }

  document.getElementById('addUserForm').addEventListener('submit', handleSubmit);
});
