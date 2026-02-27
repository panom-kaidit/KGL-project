const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/loginform/html/login.html';
    return;
  }
  loadInventory();
});

async function loadInventory() {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_BASE_URL}/api/inventory`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 401 || res.status === 403) {
      window.location.href = '/loginform/html/login.html';
      return;
    }

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const { summary, items } = await res.json();

    updateCards(summary);
    renderTable(items);

  } catch (err) {
    console.error('Failed to load inventory:', err);
    document.getElementById('inventoryTableBody').innerHTML =
      `<tr><td colspan="6" style="text-align:center;color:#c62828;padding:24px;">
        Failed to load inventory. Please try again.
      </td></tr>`;
  }
}

function updateCards(summary) {
  document.getElementById('totalStockPct').textContent  = `${summary.totalStockPercentage}%`;
  document.getElementById('inStockLabel').textContent   = `${summary.inStockCount} item${summary.inStockCount !== 1 ? 's' : ''} well stocked`;
  document.getElementById('lowStockCount').textContent  = `${summary.lowStockCount} Item${summary.lowStockCount !== 1 ? 's' : ''}`;
  document.getElementById('outOfStockCount').textContent = `${summary.outOfStockCount} Item${summary.outOfStockCount !== 1 ? 's' : ''}`;
}

function renderTable(items) {
  const tbody = document.getElementById('inventoryTableBody');

  if (!items || items.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="6" style="text-align:center;color:#999;padding:24px;">
        No inventory items found.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => {
    const { label, cls } = getStatus(item.stockKg);
    return `
      <tr>
        <td>${item.itemName}</td>
        <td>${item.category || '-'}</td>
        <td>${formatNumber(item.stockKg)}</td>
        <td>${formatCurrency(item.costPerKg)}</td>
        <td>${formatCurrency(item.salePricePerKg)}</td>
        <td><span class="status ${cls}">${label}</span></td>
      </tr>
    `;
  }).join('');
}

function getStatus(stockKg) {
  if (stockKg === 0)   return { label: 'Out of Stock', cls: 'red' };
  if (stockKg <= 200)  return { label: 'Low Stock',    cls: 'yellow' };
  return                      { label: 'In Stock',     cls: 'green' };
}

function formatNumber(num) {
  return Number(num).toLocaleString('en-US');
}

function formatCurrency(num) {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
