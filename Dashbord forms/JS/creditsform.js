/**
 * creditsform.js — Credit Payment Processing
 *
 * Flow:
 *  1. User enters a Sale ID → GET /credits/:id
 *  2. Sale details render (customer, balance, history, progress bar)
 *  3. User enters payment amount → PATCH /credits/:id/pay
 *  4. UI updates in-place; shows "fully paid" banner when amountDue hits 0
 */

'use strict';

const API_BASE = 'http://localhost:3000';

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('token');
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

let currentSale = null;   // the sale object currently displayed

// ── Alert banner ──────────────────────────────────────────────────────────────

function showAlert(message, type = 'error') {
  const box = document.getElementById('alert-box');
  box.className = `alert alert-${type}`;
  box.textContent = message;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAlert() {
  const box = document.getElementById('alert-box');
  box.className = 'alert hidden';
  box.textContent = '';
}

// ── Show / hide card sections ─────────────────────────────────────────────────

function show(id)   { document.getElementById(id).classList.remove('hidden'); }
function hide(id)   { document.getElementById(id).classList.add('hidden'); }

// ── Format helpers ────────────────────────────────────────────────────────────

function fmt(num) {
  if (num === null || num === undefined) return '—';
  return Number(num).toLocaleString('en-UG', { minimumFractionDigits: 0 });
}

function fmtDate(str) {
  if (!str) return '—';
  return str;
}

// ── Render sale details into the DOM ─────────────────────────────────────────

function renderDetails(sale) {
  // Customer
  document.getElementById('d-customer').textContent = sale.buyerName  || '—';
  document.getElementById('d-nin').textContent       = sale.NationalID || '—';
  document.getElementById('d-phone').textContent     = sale.contact    || '—';
  document.getElementById('d-location').textContent  = sale.location   || '—';

  // Product
  document.getElementById('d-product').textContent  = sale.produceName || '—';
  document.getElementById('d-tonnage').textContent  = sale.tonnage ? `${sale.tonnage} kg` : '—';
  document.getElementById('d-date').textContent     = fmtDate(sale.date);
  document.getElementById('d-duedate').textContent  = fmtDate(sale.dueDate);

  // Balance
  const totalPaid = computeTotalPaid(sale);
  const original  = (totalPaid + (sale.amountDue || 0));

  document.getElementById('d-original').textContent  = `UGX ${fmt(original)}`;
  document.getElementById('d-totalpaid').textContent = `UGX ${fmt(totalPaid)}`;
  document.getElementById('d-amountdue').textContent = `UGX ${fmt(sale.amountDue)}`;

  // Progress bar
  const pct = original > 0 ? Math.min((totalPaid / original) * 100, 100) : 0;
  document.getElementById('progress-fill').style.width  = `${pct.toFixed(1)}%`;
  document.getElementById('progress-label').textContent = `${pct.toFixed(1)}% paid`;

  // Status badge
  const badge   = document.getElementById('status-badge');
  const status  = sale.status || 'pending';
  badge.textContent = status;
  badge.className   = `badge badge-${status}`;

  // Payment history table
  renderHistory(sale.paymentHistory || []);

  // Max-amount hint on payment input
  document.getElementById('max-hint').textContent =
    `Maximum: UGX ${fmt(sale.amountDue)}`;

  // Show / hide sections
  show('details-card');

  if (status === 'paid' || (sale.amountDue || 0) <= 0) {
    hide('payment-card');
    show('paid-card');
  } else {
    show('payment-card');
    hide('paid-card');
  }
}

function computeTotalPaid(sale) {
  return (sale.paymentHistory || []).reduce((sum, e) => sum + (e.amount || 0), 0);
}

function renderHistory(entries) {
  const tbody = document.getElementById('history-body');
  document.getElementById('history-count').textContent = entries.length;

  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">No payments yet</td></tr>';
    return;
  }

  tbody.innerHTML = entries
    .map(
      (e, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${fmtDate(e.date)}</td>
          <td>UGX ${fmt(e.amount)}</td>
          <td>${e.recordedBy?.name || e.recordedBy || 'Unknown'}</td>
        </tr>`
    )
    .join('');
}

// ── Update balance in-place after a successful payment ───────────────────────

function updateBalanceUI(newAmountDue, newStatus, paymentAmount) {
  if (!currentSale) return;

  // Update local state
  currentSale.amountDue = newAmountDue;
  currentSale.status    = newStatus;
  currentSale.paymentHistory = currentSale.paymentHistory || [];
  currentSale.paymentHistory.push({
    amount: paymentAmount,
    date:   new Date().toISOString().split('T')[0],
    recordedBy: null
  });

  const totalPaid = computeTotalPaid(currentSale);
  const original  = totalPaid + newAmountDue;
  const pct       = original > 0 ? Math.min((totalPaid / original) * 100, 100) : 100;

  document.getElementById('d-totalpaid').textContent = `UGX ${fmt(totalPaid)}`;
  document.getElementById('d-amountdue').textContent = `UGX ${fmt(newAmountDue)}`;
  document.getElementById('progress-fill').style.width  = `${pct.toFixed(1)}%`;
  document.getElementById('progress-label').textContent = `${pct.toFixed(1)}% paid`;
  document.getElementById('max-hint').textContent =
    `Maximum: UGX ${fmt(newAmountDue)}`;

  const badge = document.getElementById('status-badge');
  badge.textContent = newStatus;
  badge.className   = `badge badge-${newStatus}`;

  renderHistory(currentSale.paymentHistory);

  if (newStatus === 'paid') {
    hide('payment-card');
    show('paid-card');
  }
}

// ── Search a credit sale by ID ────────────────────────────────────────────────

async function searchCredit() {
  clearAlert();
  const rawId = document.getElementById('search-id').value.trim();

  if (!rawId) {
    showAlert('Please enter a Sale ID before searching.', 'error');
    return;
  }

  const token = getToken();
  if (!token) {
    showAlert('Session expired. Please log in again.', 'error');
    setTimeout(() => { window.location.href = '/loginform/html/login.html'; }, 1500);
    return;
  }

  const btn = document.getElementById('btn-search');
  btn.disabled = true;
  btn.textContent = 'Searching…';

  try {
    const res  = await fetch(`${API_BASE}/credits/${encodeURIComponent(rawId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await res.json();

    if (!res.ok) {
      showAlert(body.message || 'Credit sale not found.', 'error');
      return;
    }

    currentSale = body.data;
    renderDetails(currentSale);

    // Reset the payment input
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-form').reset();

  } catch {
    showAlert('Network error. Please check your connection.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Search';
  }
}

// ── Submit a payment ──────────────────────────────────────────────────────────

async function submitPayment(event) {
  event.preventDefault();
  clearAlert();

  if (!currentSale) {
    showAlert('No credit sale loaded. Please search first.', 'error');
    return;
  }

  const rawAmount = document.getElementById('payment-amount').value;
  const amount    = Number(rawAmount);

  // Client-side guards (mirrors server validation)
  if (!rawAmount || isNaN(amount) || amount <= 0) {
    showAlert('Payment amount must be greater than 0.', 'error');
    return;
  }

  if (amount > currentSale.amountDue) {
    showAlert(
      `Overpayment not allowed. Maximum payment is UGX ${fmt(currentSale.amountDue)}.`,
      'error'
    );
    return;
  }

  const token = getToken();
  if (!token) {
    showAlert('Session expired. Please log in again.', 'error');
    setTimeout(() => { window.location.href = '/loginform/html/login.html'; }, 1500);
    return;
  }

  const btn = document.getElementById('btn-pay');
  btn.disabled    = true;
  btn.textContent = 'Processing…';

  try {
    const res  = await fetch(`${API_BASE}/credits/${currentSale._id}/pay`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`
      },
      body: JSON.stringify({ paymentAmount: amount })
    });
    const body = await res.json();

    if (!res.ok) {
      showAlert(body.message || 'Payment failed. Please try again.', 'error');
      return;
    }

    showAlert(body.message, 'success');
    updateBalanceUI(body.amountDue, body.status, amount);
    document.getElementById('payment-amount').value = '';

  } catch {
    showAlert('Network error. Please check your connection.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirm Payment';
  }
}

// ── Reset the whole page to initial state ─────────────────────────────────────

function resetPage() {
  currentSale = null;
  clearAlert();
  document.getElementById('search-id').value = '';
  hide('details-card');
  hide('payment-card');
  hide('paid-card');
  document.getElementById('payment-amount').value = '';
}

// ── Allow pressing Enter in the search box ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/loginform/html/login.html';
    return;
  }

  document.getElementById('search-id').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchCredit();
    }
  });
});
