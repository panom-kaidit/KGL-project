document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const cashForm = document.getElementById('cash-form');
  const creditForm = document.getElementById('credit-form');

  // Get logged-in user name from token
  const token = getToken();
  const decodedToken = token ? decodeToken(token) : null;
  const userName = decodedToken ? decodedToken.name : '';

  if (!userName) {
    alert('Error: User name not found. Please log in again.');
    window.location.href = '/loginform/html/login.html';
    return;
  }

  // Pre-fill and lock sales agent names
  document.getElementById('cash-sales-agent').value = userName;
  document.getElementById('cash-sales-agent').readOnly = true;
  document.getElementById('credit-sales-agent').value = userName;
  document.getElementById('credit-sales-agent').readOnly = true;

  // Attach submit handlers
  cashForm.addEventListener('submit', handleCashSubmit);
  creditForm.addEventListener('submit', handleCreditSubmit);

  // Initialize view
  showForm('cash');
});

const API_BASE = 'http://localhost:3000';

function showForm(type) {
  document.getElementById('cash-form').style.display = type === 'cash' ? 'grid' : 'none';
  document.getElementById('credit-form').style.display = type === 'credit' ? 'grid' : 'none';
}

// --- Cash form product handling ---
let products = [];

function addProduct() {
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-category').value;
  const qty = Number(document.getElementById('quantity').value);
  const price = Number(document.getElementById('unit-price').value);

  if (!name || !qty || !price) {
    alert('Please enter product name, quantity and price');
    return;
  }

  const total = qty * price;
  products.push({ name, category, qty, price, total });
  console.log('Added product to array. Total products:', products.length);
  console.log('Current products:', products);
  renderProducts();
  // clear inputs
  document.getElementById('product-name').value = '';
  document.getElementById('quantity').value = '';
  document.getElementById('unit-price').value = '';
}

function renderProducts() {
  const list = document.getElementById('product-list');
  const totalsum = document.getElementById('grand-total');
  list.innerHTML = '';
  let grandtotal = 0;

  products.forEach((p, index) => {
    grandtotal += Number(p.total);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.qty}</td>
      <td>${p.price.toFixed ? p.price.toFixed(2) : p.price}</td>
      <td>${p.total.toFixed ? p.total.toFixed(2) : p.total}</td>
      <td><button class="btn-remove" onclick="removeProduct(${index})">remove</button></td>
    `;
    list.appendChild(tr);
  });

  totalsum.textContent = grandtotal.toFixed(2);
}

function removeProduct(index) {
  products.splice(index, 1);
  renderProducts();
}

// --- Credit form product handling ---
let creditProducts = [];

function addProductCredit() {
  // allow user to add the produce currently entered in the credit form
  const nameInput = document.getElementById('produce-name-credit');
  const typeInput = document.getElementById('produce-type-credit');
  const qtyInput = document.getElementById('credit-tonnage');
  const priceInput = document.getElementById('credit-unit-price');

  const name = nameInput.value.trim();
  const type = typeInput.value.trim();
  const qty = Number(qtyInput.value);
  const price = Number(priceInput.value);

  console.log('AddProductCredit called:', { name, type, qty, price });

  if (!name || !qty || !price) {
    alert('Please enter produce name, tonnage, and unit price');
    return;
  }

  if (Number.isNaN(price) || Number.isNaN(qty)) {
    alert('Invalid tonnage or price');
    return;
  }

  const total = qty * price;
  creditProducts.push({ name, category: type || 'Produce', qty, price, total });
  console.log('Added credit product to array. Total products:', creditProducts.length);
  console.log('Current products:', creditProducts);
  
  renderCreditProducts();
  
  // Clear product inputs
  nameInput.value = '';
  typeInput.value = '';
  qtyInput.value = '';
  priceInput.value = '';
  
  console.log('Cleared inputs. Ready for next product.');
}

function renderCreditProducts() {
  const list = document.getElementById('credit-product-list');
  const totalsum = document.getElementById('credit-grand-total');
  list.innerHTML = '';
  let grandtotal = 0;

  creditProducts.forEach((p, index) => {
    grandtotal += Number(p.total);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${p.qty}</td>
      <td>${p.price.toFixed ? p.price.toFixed(2) : p.price}</td>
      <td>${p.total.toFixed ? p.total.toFixed(2) : p.total}</td>
      <td><button class="btn-remove" onclick="removeCreditProduct(${index})">remove</button></td>
    `;
    list.appendChild(tr);
  });

  totalsum.textContent = grandtotal.toFixed(2);
}

function removeCreditProduct(index) {
  creditProducts.splice(index, 1);
  renderCreditProducts();
}

// --- Helpers ---
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

async function postSale(payload) {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// --- Submit handlers ---
async function handleCashSubmit(e) {
  e.preventDefault();
  if (products.length === 0) return alert('Add at least one product');

  console.log('Starting cash sale submission. Total products:', products.length);
  console.log('Products:', products);

  const saleDate = document.getElementById('sale-date').value;
  const saleId = document.getElementById('sale-id').value;
  const buyer = document.getElementById('customer-name').value;
  const phone = document.getElementById('customer-phone').value;
  
  // Use logged-in user's name from token
  const token = getToken();
  const decodedToken = decodeToken(token);
  const salesAgent = decodedToken ? decodedToken.name : 'Unknown';

  console.log('Sales Agent:', salesAgent);

  // Submit a separate sale record for each product
  let successCount = 0;
  let failCount = 0;

  for (const product of products) {
    console.log('Processing product:', product);
    const payload = {
      saleType: 'cash',
      produceName: product.name,
      produceType: product.category,
      tonnage: Number(product.qty),
      amountPaid: Number(product.total),
      buyerName: buyer || null,
      salesAgentName: salesAgent,
      date: saleDate || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      nationalId: null,
      location: null,
      contacts: phone || null,
      amountDue: null,
      dueDate: null,
      dispatchDate: null,
      saleId
    };

    const res = await postSale(payload);
    console.log('Response for', product.name, ':', res);
    if (res.ok) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Show result
  if (failCount === 0) {
    alert(`All ${successCount} products recorded successfully`);
    const role = decodedToken ? decodedToken.role : '';
    window.location.href = role === 'Manager'
      ? '/Dashbord forms/html/managergosell.html'
      : '/Dashbord forms/html/goSell.html';
  } else {
    alert(`Recorded ${successCount} products, ${failCount} failed`);
  }
}

async function handleCreditSubmit(e) {
  e.preventDefault();

  const buyer = document.getElementById('buyer-name').value;
  const nationalId = document.getElementById('national-id').value;
  const location = document.getElementById('credit-location').value;
  const contacts = document.getElementById('credit-contacts').value;
  const amountDue = Number(document.getElementById('amount-due').value);
  const dueDate = document.getElementById('credit-due-date').value;
  const dispatchDate = document.getElementById('dispatch-date').value;

  if (!buyer || !nationalId) return alert('Buyer name and NIN required');
  if (creditProducts.length === 0) return alert('Add at least one product');

  // Use logged-in user's name from token
  const token = getToken();
  const decodedToken = decodeToken(token);
  const salesAgent = decodedToken ? decodedToken.name : 'Unknown';

  console.log('Starting credit sale submission. Total products:', creditProducts.length);
  console.log('Products:', creditProducts);

  // Submit a separate sale record for each product
  let successCount = 0;
  let failCount = 0;

  for (const product of creditProducts) {
    console.log('Processing product:', product);
    const payload = {
      saleType: 'credit',
      produceName: product.name,
      produceType: product.category,
      tonnage: Number(product.qty),
      amountPaid: null,
      buyerName: buyer,
      salesAgentName: salesAgent || null,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      nationalId,
      location,
      contacts,
      amountDue: Number(product.total),
      dueDate,
      dispatchDate
    };

    const res = await postSale(payload);
    console.log('Response for', product.name, ':', res);
    if (res.ok) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Show result
  if (failCount === 0) {
    alert(`All ${successCount} products recorded successfully`);
    const role = decodedToken ? decodedToken.role : '';
    window.location.href = role === 'Manager'
      ? '/Dashbord forms/html/managergosell.html'
      : '/Dashbord forms/html/goSell.html';
  } else {
    alert(`Recorded ${successCount} products, ${failCount} failed`);
  }
}
