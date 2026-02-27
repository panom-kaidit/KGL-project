const API_BASE_URL = 'http://localhost:3000';

let allSales = [];
let salesSortDirection = 'desc';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/loginform/html/login.html';
    return;
  }

  setupControls();
  loadSalesHistory();
});

function setupControls() {
  const searchInput = document.getElementById('salesSearchInput');
  const clearBtn = document.getElementById('clearSalesSearch');
  const sortDescBtn = document.getElementById('salesSortDesc');
  const sortAscBtn = document.getElementById('salesSortAsc');

  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    applyFilters();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    applyFilters();
  });

  sortDescBtn.addEventListener('click', () => {
    salesSortDirection = 'desc';
    sortDescBtn.classList.add('active');
    sortAscBtn.classList.remove('active');
    applyFilters();
  });

  sortAscBtn.addEventListener('click', () => {
    salesSortDirection = 'asc';
    sortAscBtn.classList.add('active');
    sortDescBtn.classList.remove('active');
    applyFilters();
  });
}

function applyFilters() {
  const query = document.getElementById('salesSearchInput').value.trim();

  let pattern;
  try {
    pattern = new RegExp(query, 'i');
  } catch {
    pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const filtered = query
    ? allSales.filter(sale => {
        const haystack = [
          sale.produceName,
          sale.produceType,
          sale.saleType,
          sale.buyerName,
          sale.contact,
          sale.location,
          sale.salesAgent,
          sale.date,
          sale.time
        ].join(' ');
        return pattern.test(haystack);
      })
    : [...allSales];

  filtered.sort((a, b) => {
    const dateA = a.date + ' ' + (a.time || '');
    const dateB = b.date + ' ' + (b.time || '');
    return salesSortDirection === 'desc'
      ? dateB.localeCompare(dateA)
      : dateA.localeCompare(dateB);
  });

  updateResultCount(filtered.length, allSales.length);
  displaySales(filtered);
}

function updateResultCount(shown, total) {
  const el = document.getElementById('salesResultCount');
  if (!el) return;
  el.textContent = shown === total
    ? `${total} record${total !== 1 ? 's' : ''}`
    : `Showing ${shown} of ${total} records`;
}

async function loadSalesHistory() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/sales/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401 || response.status === 403) {
      window.location.href = '/loginform/html/login.html';
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch sales: ${response.status}`);
    }

    const result = await response.json();
    allSales = result.data || [];

    applyFilters();

  } catch (error) {
    console.error('Error loading sales history:', error);
    document.getElementById('salesTableBody').innerHTML =
      '<tr class="error-row"><td colspan="10" class="text-center">Error loading sales. Please try again.</td></tr>';
  }
}

function displaySales(sales) {
  const tableBody = document.getElementById('salesTableBody');
  const noResults = document.getElementById('salesNoResults');

  if (!sales || sales.length === 0) {
    tableBody.innerHTML = '';
    noResults.classList.remove('no-results--hidden');
    return;
  }

  noResults.classList.add('no-results--hidden');

  tableBody.innerHTML = sales.map(sale => {
    const isCash = sale.saleType === 'cash';
    const amount = isCash
      ? formatCurrency(sale.amountPaid || 0)
      : formatCurrency(sale.amountDue || 0);
    const badgeClass = isCash ? 'cash' : 'credit';
    const badgeLabel = isCash ? 'Cash' : 'Credit';
    const statusLabel = isCash
      ? '<span class="badge cash">Paid</span>'
      : '<span class="badge credit">Credit</span>';

    return `
      <tr>
        <td>${formatDate(sale.date)}</td>
        <td>${sale.time || '-'}</td>
        <td>${sale.produceName || '-'}</td>
        <td>${sale.produceType || '-'}</td>
        <td>${formatNumber(sale.tonnage || 0)} kg</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        <td>${amount}</td>
        <td>${sale.buyerName || '-'}</td>
        <td>${sale.contact || '-'}</td>
        <td>${statusLabel}</td>
      </tr>
    `;
  }).join('');
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatNumber(num) {
  return Math.round(num).toLocaleString('en-US');
}

function formatCurrency(num) {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
