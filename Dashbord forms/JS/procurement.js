// Base API URL - Update this to match your backend server URL
const API_BASE_URL = 'http://localhost:3000'; // Must match the port your backend is running on

// Form elements will be initialized after DOM is ready
let procurementForm;
let supplierNameInput;
let supplierContactInput;
let purchaseDateInput;
let produceTimeInput;
let invoiceNumberInput;
let productNameInput;
let productCategoryInput;
let quantityInput;
let unitPriceInput;
let sellingPriceInput;
let branchInput;
let totalAmountInput; // legacy alias, will point to sellingPriceInput

// Initialize form elements when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing form elements...');
  
  procurementForm = document.querySelector('.form-box');
  supplierNameInput = document.getElementById('supplier-name');
  supplierContactInput = document.getElementById('supplier-contact');
  purchaseDateInput = document.getElementById('purchase-date');
  produceTimeInput = document.getElementById('produce-time');
  invoiceNumberInput = document.getElementById('invoice-number');
  productNameInput = document.getElementById('product-name');
  productCategoryInput = document.getElementById('product-category');
  quantityInput = document.getElementById('quantity');
  unitPriceInput = document.getElementById('unit-price');
  sellingPriceInput = document.getElementById('selling-price');
  branchInput = document.getElementById('branch');
  // backwards compatibility alias
  totalAmountInput = sellingPriceInput;

  console.log('Form found:', !!procurementForm);
  console.log('All form inputs found:', {
    supplierName: !!supplierNameInput,
    supplierContact: !!supplierContactInput,
    purchaseDate: !!purchaseDateInput,
    invoiceNumber: !!invoiceNumberInput,
    productName: !!productNameInput,
    productCategory: !!productCategoryInput,
    quantity: !!quantityInput,
    unitPrice: !!unitPriceInput,
    totalAmount: !!totalAmountInput
  });

  // Add form submission handler
  if (procurementForm) {
    procurementForm.addEventListener('submit', handleFormSubmit);
    console.log('Form submission handler attached');
  } else {
    console.error('Form not found! Check if .form-box exists in HTML');
  }

  // Setup auto-calculation
  if (quantityInput && unitPriceInput && totalAmountInput) {
    const calculateTotal = () => {
      const quantity = parseFloat(quantityInput.value) || 0;
      const unitPrice = parseFloat(unitPriceInput.value) || 0;
      const total = quantity * unitPrice;
      totalAmountInput.value = total.toFixed(2);
    };

    quantityInput.addEventListener('change', calculateTotal);
    unitPriceInput.addEventListener('change', calculateTotal);
    quantityInput.addEventListener('input', calculateTotal);
    unitPriceInput.addEventListener('input', calculateTotal);
  }
});

// Form submission handler
async function handleFormSubmit(e) {
  e.preventDefault();
  console.log('Form submitted');
  
  try {
    // Get payment method
    const paymentMethodRadios = document.querySelectorAll('input[name="payment"]');
    let paymentMethod = '';
    for (let radio of paymentMethodRadios) {
      if (radio.checked) {
        paymentMethod = radio.value || radio.parentElement.textContent.trim();
        break;
      }
    }

    // Get payment status
    const paymentStatusRadios = document.querySelectorAll('input[name="payment_status"]');
    let paymentStatus = '';
    for (let radio of paymentStatusRadios) {
      if (radio.checked) {
        paymentStatus = radio.value;
        break;
      }
    }

    console.log('Payment method:', paymentMethod);
    console.log('Payment status:', paymentStatus);

    // Validate required fields with rules
    const namePattern = /^[A-Za-z0-9 ]+$/;
    const typePattern = /^[A-Za-z ]{2,}$/;
    const dealerPattern = /^[A-Za-z0-9 ]{2,}$/;
    const phonePattern = /^[0-9+]{10,15}$/;

    if (!supplierNameInput.value || !namePattern.test(supplierNameInput.value)) {
      showAlert('Supplier name must be alphanumeric and at least 1 character', 'error');
      return;
    }
    if (!supplierContactInput.value || !phonePattern.test(supplierContactInput.value)) {
      showAlert('Please provide a valid contact phone number', 'error');
      return;
    }
    if (!purchaseDateInput.value) {
      showAlert('Purchase date is required', 'error');
      return;
    }
    if (!produceTimeInput.value) {
      showAlert('Produce time is required', 'error');
      return;
    }
    if (!invoiceNumberInput.value) {
      showAlert('Invoice number is required', 'error');
      return;
    }
    if (!productNameInput.value || !namePattern.test(productNameInput.value)) {
      showAlert('Product/produce name must be alphanumeric', 'error');
      return;
    }
    if (!productCategoryInput.value || !typePattern.test(productCategoryInput.value)) {
      showAlert('Produce type must be alphabetic and at least 2 characters', 'error');
      return;
    }
    if (!quantityInput.value || isNaN(quantityInput.value) || parseInt(quantityInput.value) < 100) {
      showAlert('Tonnage must be numeric and at least 3 digits (>=100)', 'error');
      return;
    }
    if (!unitPriceInput.value || isNaN(unitPriceInput.value) || parseFloat(unitPriceInput.value) < 10000) {
      showAlert('Cost must be numeric and at least 5 digits (>=10000)', 'error');
      return;
    }
    if (!branchInput.value) {
      showAlert('Please select a branch', 'error');
      return;
    }

    // Calculate selling price if empty
    let sellingPrice = sellingPriceInput.value;
    if (!sellingPrice || sellingPrice === 0) {
      sellingPrice = parseFloat(quantityInput.value) * parseFloat(unitPriceInput.value);
    }

    // Prepare form data
    const formData = {
      supplier_name: supplierNameInput.value,
      supplier_contact: supplierContactInput.value,
      purchase_date: purchaseDateInput.value,
      produce_time: produceTimeInput.value,
      invoice_number: invoiceNumberInput.value,
      product_name: productNameInput.value,
      product_category: productCategoryInput.value || '',
      quantity: parseFloat(quantityInput.value),
      unit_price: parseFloat(unitPriceInput.value),
      selling_price: parseFloat(sellingPrice),
      branch: branchInput.value,
      payment_method: paymentMethod,
      payment_status: paymentStatus
    };

    console.log('Submitting procurement form:', formData);

    // Get token from localStorage (stored during login as 'token')
    const token = localStorage.getItem('token');
    
    if (!token) {
      showAlert('Please login first', 'error');
      console.error('No auth token found in localStorage');
      window.location.href = '/loginform/html/login.html';
      return;
    }

    console.log('Auth token found:', token.substring(0, 20) + '...');

    // Make API request
    console.log(`Making API request to: ${API_BASE_URL}/procurement`);
    const response = await fetch(`${API_BASE_URL}/procurement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const result = await response.json();
    console.log('Response data:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit procurement form');
    }

    // Success handling
    showAlert('Procurement record created successfully!', 'success');
    console.log('Procurement created:', result.data);

    // Reset form
    procurementForm.reset();

    // Optional: Redirect to dashboard after successful submission
    setTimeout(() => {
      window.location.href = '/Dashbord forms/html/managersDashboard.html';
    }, 2000);

  } catch (error) {
    console.error('Error submitting procurement form:', error);
    showAlert(error.message || 'Error submitting procurement form', 'error');
  }
}

// Alert function to show messages to user
function showAlert(message, type = 'info') {
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 4px;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-in-out;
    max-width: 400px;
  `;

  // Set color based on alert type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3',
    warning: '#ff9800'
  };

  const textColor = '#fff';
  const backgroundColor = colors[type] || colors.info;

  alertContainer.style.backgroundColor = backgroundColor;
  alertContainer.style.color = textColor;
  alertContainer.textContent = message;

  // Add CSS animation
  const style = document.createElement('style');
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
  
  if (!document.querySelector('style[data-alert]')) {
    style.setAttribute('data-alert', 'true');
    document.head.appendChild(style);
  }

  document.body.appendChild(alertContainer);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    alertContainer.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => {
      alertContainer.remove();
    }, 300);
  }, 3000);
}

// Fetch and display procurement records (optional - for viewing submitted records)
async function fetchProcurementRecords() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('No auth token found');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/procurement`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch procurement records');
    }

    const result = await response.json();
    console.log('Procurement records:', result.data);
    
    return result.data;

  } catch (error) {
    console.error('Error fetching procurement records:', error);
  }
}

// Export functions for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchProcurementRecords,
    showAlert
  };
}
