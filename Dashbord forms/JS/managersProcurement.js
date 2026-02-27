// Base API URL
const API_BASE_URL = 'http://localhost:3000';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Managers Procurement page loaded');
  
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    showAlert('Please login first', 'error');
    window.location.href = '/loginform/html/login.html';
    return;
  }

  // Load procurements for manager's branch
  loadProcurements();
});

/**
 * Load procurements filtered by manager's branch
 */
async function loadProcurements() {
  try {
    const token = localStorage.getItem('token');
    const managerBranch = localStorage.getItem('userBranch');

    console.log('Loading procurements for branch:', managerBranch);

    if (!managerBranch) {
      showAlert('Branch information not found. Please login again.', 'warning');
      return;
    }

    // Fetch all procurements
    const response = await fetch(`${API_BASE_URL}/procurement`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch procurements: ${response.status}`);
    }

    const result = await response.json();
    console.log('All procurements:', result.data);

    // Filter procurements by manager's branch
    const filteredProcurements = result.data.filter(proc => proc.branch === managerBranch);
    console.log(`Filtered procurements for ${managerBranch}:`, filteredProcurements);

    // Display in table
    displayProcurements(filteredProcurements);

  } catch (error) {
    console.error('Error loading procurements:', error);
    showAlert(error.message || 'Error loading procurements', 'error');
    
    // Show no results message
    document.getElementById('procurementTableBody').innerHTML = 
      '<tr class="error-row"><td colspan="12" class="text-center">Error loading procurements. Please try again.</td></tr>';
  }
}

/**
 * Display procurements in table
 */
function displayProcurements(procurements) {
  const tableBody = document.getElementById('procurementTableBody');
  const noResultsMessage = document.getElementById('noResultsMessage');

  if (!procurements || procurements.length === 0) {
    tableBody.innerHTML = '';
    noResultsMessage.style.display = 'flex';
    return;
  }

  // Hide no results message
  noResultsMessage.style.display = 'none';

  // Sort by date descending (most recent first)
  procurements.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build table rows
  tableBody.innerHTML = procurements.map(proc => {
    const statusBadge = getStatusBadge(proc.date);
    
    return `
      <tr class="procurement-row" data-id="${proc._id}">
        <td>${formatDate(proc.date)}</td>
        <td>${proc.time || '-'}</td>
        <td>${proc.produceName || '-'}</td>
        <td>${proc.produceType || '-'}</td>
        <td>${formatNumber(proc.tonnage || 0)} kg</td>
        <td>${formatCurrency(proc.cost || 0)}</td>
        <td>${formatCurrency(proc.sellingPrice || 0)}</td>
        <td>${proc.dealerName || '-'}</td>
        <td>${proc.contact || '-'}</td>
        <td><span class="badge branch">${proc.branch || '-'}</span></td>
        <td>${proc.recordedByName || '-'}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');

  console.log(`Displayed ${procurements.length} procurements`);
}

/**
 * Get status badge based on date
 */
function getStatusBadge(dateString) {
  const procDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  procDate.setHours(0, 0, 0, 0);

  if (procDate.getTime() === today.getTime()) {
    return '<span class="badge status-today">Today</span>';
  } else if (procDate > today) {
    return '<span class="badge status-upcoming">Upcoming</span>';
  } else {
    return '<span class="badge status-past">Past</span>';
  }
}

/**
 * Format date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format number with thousands separator
 */
function formatNumber(num) {
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Format currency
 */
function formatCurrency(num) {
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).replace('UGX', '').trim();
}

/**
 * Show alert notification
 */
function showAlert(message, type = 'info') {
  const alertContainer = document.createElement('div');
  alertContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 4px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease-in-out;
    max-width: 400px;
  `;

  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3',
    warning: '#ff9800'
  };

  alertContainer.style.backgroundColor = colors[type] || colors.info;
  alertContainer.style.color = '#fff';
  alertContainer.textContent = message;

  const style = document.createElement('style');
  if (!document.querySelector('style[data-alert]')) {
    style.setAttribute('data-alert', 'true');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(alertContainer);

  setTimeout(() => {
    alertContainer.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => alertContainer.remove(), 300);
  }, 3000);
}
