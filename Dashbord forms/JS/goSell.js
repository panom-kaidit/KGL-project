const API_BASE_URL = 'http://localhost:3000';

let allSales = [];
let salesSortDirection = 'desc';
let saleTypeFilter = 'all'; // 'all' | 'cash' | 'credit'

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/loginform/html/login.html';
    return;
  }

  setupControls();
  loadBranchSales();
});

function setupControls() {
  const searchInput = document.getElementById('salesSearchInput');
  const clearBtn    = document.getElementById('clearSalesSearch');
  const sortDescBtn = document.getElementById('salesSortDesc');
  const sortAscBtn  = document.getElementById('salesSortAsc');
  const filterAll    = document.getElementById('filterAll');
  const filterCash   = document.getElementById('filterCash');
  const filterCredit = document.getElementById('filterCredit');

  // Search
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
    applyFilters();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    applyFilters();
  });

  // Date sort
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

  // Sale type filter
  filterAll.addEventListener('click', () => {
    saleTypeFilter = 'all';
    setActiveTypeBtn(filterAll);
    applyFilters();
  });

  filterCash.addEventListener('click', () => {
    saleTypeFilter = 'cash';
    setActiveTypeBtn(filterCash);
    applyFilters();
  });

  filterCredit.addEventListener('click', () => {
    saleTypeFilter = 'credit';
    setActiveTypeBtn(filterCredit);
    applyFilters();
  });
}

function setActiveTypeBtn(activeBtn) {
  ['filterAll', 'filterCash', 'filterCredit'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  activeBtn.classList.add('active');
}

function applyFilters() {
  const query = document.getElementById('salesSearchInput').value.trim();

  // Build regex (with fallback for invalid patterns)
  let pattern;
  try {
    pattern = new RegExp(query, 'i');
  } catch {
    pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  let filtered = allSales;

  // Filter by sale type
  if (saleTypeFilter !== 'all') {
    filtered = filtered.filter(sale => sale.saleType === saleTypeFilter);
  }

  // Filter by search query
  if (query) {
    filtered = filtered.filter(sale => {
      const agentName = sale.recordedBy?.name || sale.salesAgent || '';
      const haystack = [
        sale.produceName,
        sale.produceType,
        sale.saleType,
        sale.buyerName,
        sale.contact,
        sale.location,
        agentName,
        sale.date,
        sale.time
      ].join(' ');
      return pattern.test(haystack);
    });
  }

  // Sort by date (and time as tiebreaker)
  filtered = [...filtered].sort((a, b) => {
    const dateA = (a.date || '') + ' ' + (a.time || '');
    const dateB = (b.date || '') + ' ' + (b.time || '');
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

async function loadBranchSales() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/sales/branch`, {
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
    console.error('Error loading branch sales:', error);
    document.getElementById('salesTableBody').innerHTML =
      '<tr class="error-row"><td colspan="11" class="text-center">Error loading sales. Please try again.</td></tr>';
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
    const saleTypeBadge = isCash
      ? '<span class="badge cash">Cash</span>'
      : '<span class="badge credit">Credit</span>';
    const statusBadge = isCash
      ? '<span class="badge cash">Paid</span>'
      : '<span class="badge credit">Due</span>';

    const agentName = sale.recordedBy?.name || sale.salesAgent || '-';

    return `
      <tr>
        <td>${formatDate(sale.date)}</td>
        <td>${sale.time || '-'}</td>
        <td>${sale.produceName || '-'}</td>
        <td>${sale.produceType || '-'}</td>
        <td>${formatNumber(sale.tonnage || 0)} kg</td>
        <td>${saleTypeBadge}</td>
        <td>${amount}</td>
        <td>${sale.buyerName || '-'}</td>
        <td>${sale.contact || '-'}</td>
        <td>${agentName}</td>
        <td>${statusBadge}</td>
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
