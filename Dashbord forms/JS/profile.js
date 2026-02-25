const API_BASE = 'http://localhost:3000';

// Utility functions
function getToken() {
  return localStorage.getItem('token');
}

function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

// Load user profile on page load
document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();

  if (!token) {
    alert('Please log in first');
    window.location.href = '/loginform/html/login.html';
    return;
  }

  const decodedToken = decodeToken(token);
  if (!decodedToken || !decodedToken.id) {
    alert('Invalid token. Please log in again.');
    window.location.href = '/loginform/html/login.html';
    return;
  }

  // Fetch user details from backend
  try {
    const response = await fetch(`${API_BASE}/users/${decodedToken.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    const user = await response.json();
    
    // Display user information
    displayUserProfile(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    // Fallback to token info
    displayUserProfile({
      name: decodedToken.name || 'Unknown User',
      email: 'Not available',
      role: decodedToken.role || 'User',
      phone: 'Not available',
      branch: 'Not available'
    });
  }
});

function displayUserProfile(user) {
  // Update seller name
  const nameElements = document.querySelectorAll('h3');
  if (nameElements.length > 0) {
    nameElements[0].textContent = user.name || 'Unknown User';
  }

  // Update role
  const roleElements = document.querySelectorAll('.role');
  if (roleElements.length > 0) {
    const roleText = user.role === 'Sales-agent' ? 'Sales Agent' : user.role || 'User';
    roleElements[0].textContent = roleText;
  }

  // Update profile info
  const profileInfo = document.querySelector('.profile--info');
  if (profileInfo) {
    profileInfo.innerHTML = `
      <p><strong>Branch:</strong> ${user.branch || 'Not specified'}</p>
      <p><strong>Email:</strong> ${user.email || 'Not available'}</p>
      <p><strong>Phone:</strong> ${user.phone || 'Not available'}</p>
    `;
  }

  // Update bio if available
  const bioParagraph = document.querySelector('.profile--bio p');
  if (bioParagraph) {
    bioParagraph.textContent = user.bio || 'Welcome to Karibu! Update your profile to add a bio.';
  }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.querySelector('a i.fa-sign-out-alt');
  if (logoutLink) {
    logoutLink.parentElement.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/loginform/html/login.html';
    });
  }
});
