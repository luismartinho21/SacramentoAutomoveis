let carsList = [];
let messagesList = [];

// Staged files management (for file uploads)
let stagedNewFiles = [];
let stagedExistingImages = []; // kept images during edit

document.addEventListener('DOMContentLoaded', () => {
  checkSession();

  // Authentication Events
  document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  // Panel Tabs Events
  document.getElementById('tab-btn-stock').addEventListener('click', () => switchTab('stock'));
  document.getElementById('tab-btn-messages').addEventListener('click', () => switchTab('messages'));

  // Vehicle Modal Actions
  document.getElementById('btn-add-car').addEventListener('click', () => openCarModal(null));
  document.getElementById('btn-close-car-modal').addEventListener('click', closeCarModal);
  document.getElementById('btn-cancel-car-modal').addEventListener('click', closeCarModal);
  document.getElementById('vehicle-management-form').addEventListener('submit', handleCarSubmit);

  // File Upload Elements
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('form-images-input');

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Drag & Drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border-color)';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer.files.length > 0) {
      stageFiles(e.dataTransfer.files);
    }
  });

  // Message Modal Actions
  document.getElementById('btn-close-msg-modal').addEventListener('click', closeMsgModal);
  document.getElementById('btn-close-msg-modal-footer').addEventListener('click', closeMsgModal);
});

// Check if admin session is active
async function checkSession() {
  try {
    const response = await fetch('/api/auth/session');
    const data = await response.json();
    
    if (data.loggedIn) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('Error checking session:', err);
    showLogin();
  }
}

// Show login screen
function showLogin() {
  document.getElementById('login-panel').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

// Show dashboard panel and load lists
function showDashboard() {
  document.getElementById('login-panel').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'flex';
  loadDashboardData();
}

function loadDashboardData() {
  loadAdminCars();
  loadAdminMessages();
}

// Switch between navigation tabs
function switchTab(tabName) {
  const stockBtn = document.getElementById('tab-btn-stock');
  const msgBtn = document.getElementById('tab-btn-messages');
  const stockPanel = document.getElementById('panel-stock');
  const msgPanel = document.getElementById('panel-messages');

  if (tabName === 'stock') {
    stockBtn.classList.add('active');
    msgBtn.classList.remove('active');
    stockPanel.classList.add('active');
    msgPanel.classList.remove('active');
    loadAdminCars();
  } else {
    stockBtn.classList.remove('active');
    msgBtn.classList.add('active');
    stockPanel.classList.remove('active');
    msgPanel.classList.add('active');
    loadAdminMessages();
  }
}

// --- LOGIN & LOGOUT HANDLERS ---
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username').value;
  const passwordInput = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error-msg');

  errorEl.style.display = 'none';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });

    const result = await response.json();
    if (response.ok && result.success) {
      showDashboard();
    } else {
      errorEl.textContent = result.error || 'Credenciais inválidas.';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Login error:', err);
    errorEl.textContent = 'Erro ao conectar ao servidor.';
    errorEl.style.display = 'block';
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) {
      showLogin();
    }
  } catch (err) {
    console.error('Logout error:', err);
    showLogin();
  }
}

// --- INVENTORY MANAGEMENT LAYER ---

// Load vehicle listings
async function loadAdminCars() {
  const tbody = document.getElementById('admin-cars-tbody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">A carregar stock...</td></tr>`;

  try {
    const response = await fetch('/api/cars');
    carsList = await response.json();
    
    tbody.innerHTML = '';
    
    if (carsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px 0;">O stand não tem viaturas em stock. Clique em "Adicionar Viatura" para começar.</td></tr>`;
      return;
    }

    carsList.forEach(car => {
      const tr = document.createElement('tr');
      const coverImg = car.images && car.images.length > 0 
        ? `/uploads/vehicles/${car.images[0]}` 
        : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=150';

      const formattedPrice = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price);
      const formattedMileage = new Intl.NumberFormat('pt-PT').format(car.mileage) + ' km';

      tr.innerHTML = `
        <td>
          <div class="admin-car-info">
            <img src="${coverImg}" alt="${car.brand}" class="admin-car-thumb" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=150'">
            <div>
              <div class="admin-car-title">${car.brand} ${car.model}</div>
              <div class="admin-car-version">${car.version || ''}</div>
            </div>
          </div>
        </td>
        <td>${car.year}</td>
        <td>${car.fuel}</td>
        <td>${car.transmission}</td>
        <td>${formattedMileage}</td>
        <td><span class="price-text">${formattedPrice}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit" title="Editar Viatura" onclick="openCarModal(${car.id})">
              <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
            </button>
            <button class="btn-icon delete" title="Eliminar Viatura" onclick="deleteCar(${car.id})">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    lucide.createIcons();
  } catch (err) {
    console.error('Error loading admin cars:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444;">Erro ao obter viaturas.</td></tr>`;
  }
}

// Open Car Form Modal (Add or Edit mode)
async function openCarModal(carId = null) {
  const modal = document.getElementById('car-form-modal');
  const form = document.getElementById('vehicle-management-form');
  const titleEl = document.getElementById('car-modal-title');
  const errorEl = document.getElementById('form-error-msg');
  
  errorEl.style.display = 'none';
  form.reset();
  
  // Clear staging lists
  stagedNewFiles = [];
  stagedExistingImages = [];
  renderNewPreviews();
  
  if (carId) {
    // EDIT MODE
    titleEl.textContent = 'Editar Viatura';
    document.getElementById('form-car-id').value = carId;
    
    try {
      const response = await fetch(`/api/cars/${carId}`);
      const car = await response.json();
      
      // Load inputs
      document.getElementById('form-brand').value = car.brand;
      document.getElementById('form-model').value = car.model;
      document.getElementById('form-version').value = car.version || '';
      document.getElementById('form-color').value = car.color || '';
      document.getElementById('form-price').value = car.price;
      document.getElementById('form-year').value = car.year;
      document.getElementById('form-mileage').value = car.mileage;
      document.getElementById('form-fuel').value = car.fuel;
      document.getElementById('form-transmission').value = car.transmission;
      document.getElementById('form-power').value = car.power || '';
      document.getElementById('form-engine').value = car.engine_size || '';
      document.getElementById('form-description').value = car.description || '';
      
      // Set features checkboxes
      const checkBoxes = document.querySelectorAll('#form-features-grid input[type="checkbox"]');
      checkBoxes.forEach(box => {
        box.checked = car.features && car.features.includes(box.value);
      });

      // Load existing images
      stagedExistingImages = car.images || [];
      renderExistingPreviews();

    } catch (err) {
      console.error('Error fetching car details for form:', err);
      alert('Erro ao carregar os dados da viatura.');
      return;
    }
  } else {
    // ADD MODE
    titleEl.textContent = 'Adicionar Nova Viatura';
    document.getElementById('form-car-id').value = '';
    
    // Hide existing images previews
    document.getElementById('existing-images-label').style.display = 'none';
    document.getElementById('existing-images-preview').innerHTML = '';
  }

  modal.classList.add('active');
  lucide.createIcons();
}

function closeCarModal() {
  document.getElementById('car-form-modal').classList.remove('active');
}

// Stage files from Input or Dropzone
function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    stageFiles(e.target.files);
  }
}

function stageFiles(files) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Validate sizes & types
    if (!/image\/.*/.test(file.type)) {
      alert(`O ficheiro ${file.name} não é uma imagem válida.`);
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(`A imagem ${file.name} excede o limite de 5MB.`);
      continue;
    }
    stagedNewFiles.push(file);
  }
  renderNewPreviews();
}

// Render staged new images preview thumbnails
function renderNewPreviews() {
  const container = document.getElementById('new-images-preview');
  const label = document.getElementById('new-images-label');
  container.innerHTML = '';

  if (stagedNewFiles.length === 0) {
    label.style.display = 'none';
    return;
  }

  label.style.display = 'block';
  
  stagedNewFiles.forEach((file, idx) => {
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-img-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.type = 'button';
    removeBtn.addEventListener('click', () => {
      stagedNewFiles.splice(idx, 1);
      renderNewPreviews();
    });

    div.appendChild(img);
    div.appendChild(removeBtn);
    container.appendChild(div);
  });
}

// Render existing images previews
function renderExistingPreviews() {
  const container = document.getElementById('existing-images-preview');
  const label = document.getElementById('existing-images-label');
  container.innerHTML = '';

  if (stagedExistingImages.length === 0) {
    label.style.display = 'none';
    return;
  }

  label.style.display = 'block';

  stagedExistingImages.forEach((imgName, idx) => {
    const div = document.createElement('div');
    div.className = 'image-preview-item';
    
    const img = document.createElement('img');
    img.src = `/uploads/vehicles/${imgName}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-img-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.type = 'button';
    removeBtn.addEventListener('click', () => {
      stagedExistingImages.splice(idx, 1);
      renderExistingPreviews();
    });

    div.appendChild(img);
    div.appendChild(removeBtn);
    container.appendChild(div);
  });
}

// Submit Car Form (Add / Edit)
async function handleCarSubmit(e) {
  e.preventDefault();
  const errorEl = document.getElementById('form-error-msg');
  const submitBtn = document.getElementById('btn-submit-car-form');
  errorEl.style.display = 'none';

  const carId = document.getElementById('form-car-id').value;
  const brand = document.getElementById('form-brand').value;
  const model = document.getElementById('form-model').value;
  const price = document.getElementById('form-price').value;
  const year = document.getElementById('form-year').value;
  const mileage = document.getElementById('form-mileage').value;
  const fuel = document.getElementById('form-fuel').value;
  const transmission = document.getElementById('form-transmission').value;

  if (!brand || !model || !price || !year || !mileage || !fuel || !transmission) {
    errorEl.textContent = 'Preencha todos os campos obrigatórios (*).';
    errorEl.style.display = 'block';
    return;
  }

  // Validate images (must have at least 1 image - either new or existing)
  if (stagedNewFiles.length === 0 && stagedExistingImages.length === 0) {
    errorEl.textContent = 'Deve anexar pelo menos 1 foto da viatura.';
    errorEl.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;

  // Build FormData payload
  const formData = new FormData();
  formData.append('brand', brand);
  formData.append('model', model);
  formData.append('version', document.getElementById('form-version').value);
  formData.append('color', document.getElementById('form-color').value);
  formData.append('price', price);
  formData.append('year', year);
  formData.append('mileage', mileage);
  formData.append('fuel', fuel);
  formData.append('transmission', transmission);
  formData.append('power', document.getElementById('form-power').value);
  formData.append('engine_size', document.getElementById('form-engine').value);
  formData.append('description', document.getElementById('form-description').value);

  // Features Checklist to JSON String
  const checkedFeatures = [];
  const checkBoxes = document.querySelectorAll('#form-features-grid input[type="checkbox"]:checked');
  checkBoxes.forEach(box => checkedFeatures.push(box.value));
  formData.append('features', JSON.stringify(checkedFeatures));

  // If editing, append list of kept image files
  if (carId) {
    formData.append('existing_images', JSON.stringify(stagedExistingImages));
  }

  // Append new files
  stagedNewFiles.forEach(file => {
    formData.append('images', file);
  });

  const url = carId ? `/api/cars/${carId}` : '/api/cars';
  const method = carId ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method: method,
      body: formData
    });

    const result = await response.json();

    if (response.ok && (result.success || result.id)) {
      closeCarModal();
      loadAdminCars();
    } else {
      errorEl.textContent = result.error || 'Erro ao guardar dados do veículo.';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Error submitting vehicle form:', err);
    errorEl.textContent = 'Erro ao comunicar com o servidor.';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
  }
}

// Delete Vehicle
async function deleteCar(carId) {
  if (!confirm('Tem a certeza que deseja eliminar esta viatura do catálogo? Esta ação não pode ser revertida.')) {
    return;
  }

  try {
    const response = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
    const result = await response.json();
    if (response.ok && result.success) {
      loadAdminCars();
    } else {
      alert(result.error || 'Erro ao eliminar viatura.');
    }
  } catch (err) {
    console.error('Delete car error:', err);
    alert('Erro de comunicação.');
  }
}

// --- MESSAGES INBOX LAYER ---

// Load inbox message inquiries
async function loadAdminMessages() {
  const tbody = document.getElementById('admin-messages-tbody');
  const badge = document.getElementById('unread-messages-badge');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">A carregar mensagens...</td></tr>`;

  try {
    const response = await fetch('/api/contacts');
    messagesList = await response.json();
    
    tbody.innerHTML = '';
    
    // Count unread
    const unreadCount = messagesList.filter(m => m.status === 'new').length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

    if (messagesList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px 0;">Não existem mensagens recebidas.</td></tr>`;
      return;
    }

    messagesList.forEach(msg => {
      const tr = document.createElement('tr');
      
      // Status Badge
      let statusLabel = 'Novo';
      if (msg.status === 'read') statusLabel = 'Lido';
      if (msg.status === 'archived') statusLabel = 'Arquivado';

      // Ref Car Details
      let carRef = 'Mensagem Geral';
      if (msg.vehicle_id) {
        carRef = `
          <div class="inquiry-car-ref">
            <span>${msg.brand} ${msg.model}</span>
            <span>${msg.year} • ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(msg.price)}</span>
          </div>
        `;
      }

      // Date Format
      const formattedDate = new Date(msg.created_at).toLocaleDateString('pt-PT', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      // HTML Row
      tr.innerHTML = `
        <td><span class="inquiry-status ${msg.status}">${statusLabel}</span></td>
        <td>
          <div style="font-weight:600; color:#fff;">${msg.name}</div>
          <div style="font-size:12px;">${msg.email}</div>
          <div style="font-size:12px;">${msg.phone || '-'}</div>
        </td>
        <td>${carRef}</td>
        <td>
          <div class="message-text" onclick="viewMessageDetails(${msg.id})">
            ${msg.message}
          </div>
        </td>
        <td>${formattedDate}</td>
        <td>
          <div class="actions-cell">
            ${msg.status !== 'read' ? `
              <button class="btn-icon" title="Marcar como lida" onclick="updateMessageStatus(${msg.id}, 'read')">
                <i data-lucide="check" style="width: 16px; height: 16px;"></i>
              </button>
            ` : ''}
            ${msg.status !== 'archived' ? `
              <button class="btn-icon" title="Arquivar mensagem" onclick="updateMessageStatus(${msg.id}, 'archived')">
                <i data-lucide="archive" style="width: 16px; height: 16px;"></i>
              </button>
            ` : ''}
            <button class="btn-icon delete" title="Eliminar" onclick="deleteMessage(${msg.id})">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    lucide.createIcons();
  } catch (err) {
    console.error('Error loading admin messages:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444;">Erro ao obter mensagens.</td></tr>`;
  }
}

// View message full detail modal
async function viewMessageDetails(msgId) {
  const modal = document.getElementById('message-detail-modal');
  const msg = messagesList.find(m => m.id === msgId);
  if (!msg) return;

  document.getElementById('msg-detail-name').textContent = msg.name;
  document.getElementById('msg-detail-email').textContent = msg.email;
  document.getElementById('msg-detail-phone').textContent = msg.phone || 'Nenhum';
  
  const formattedDate = new Date(msg.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  document.getElementById('msg-detail-date').textContent = formattedDate;

  // Ref Car Title
  let carTitle = 'Mensagem Geral (Sem referência de veículo)';
  if (msg.vehicle_id) {
    const formattedPrice = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(msg.price);
    carTitle = `${msg.brand} ${msg.model} ${msg.version || ''} (${msg.year}) - ${formattedPrice}`;
  }
  document.getElementById('msg-detail-car').textContent = carTitle;

  // Message Content
  document.getElementById('msg-detail-text').textContent = msg.message;

  // Setup reply mailto button
  const mailBtn = document.getElementById('btn-reply-email');
  if (mailBtn) {
    mailBtn.onclick = () => {
      const subject = encodeURIComponent(`Contacto Sacramento Automóveis - Ref: ${msg.vehicle_id ? msg.brand + ' ' + msg.model : 'Mensagem Geral'}`);
      window.location.href = `mailto:${msg.email}?subject=${subject}`;
    };
  }

  modal.classList.add('active');
  lucide.createIcons();

  // If status is new, automatically flag it as read
  if (msg.status === 'new') {
    await updateMessageStatus(msgId, 'read', false); // silent update without closing
  }
}

function closeMsgModal() {
  document.getElementById('message-detail-modal').classList.remove('active');
}

// Update Message Status
async function updateMessageStatus(msgId, newStatus, reloadList = true) {
  try {
    const response = await fetch(`/api/contacts/${msgId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      if (reloadList) {
        loadAdminMessages();
      } else {
        // Just update count badge in-place silently
        const msg = messagesList.find(m => m.id === msgId);
        if (msg) msg.status = newStatus;
        const unreadCount = messagesList.filter(m => m.status === 'new').length;
        const badge = document.getElementById('unread-messages-badge');
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  } catch (err) {
    console.error('Error updating message status:', err);
  }
}

// Delete customer message
async function deleteMessage(msgId) {
  if (!confirm('Deseja eliminar esta mensagem permanentemente?')) {
    return;
  }

  try {
    const response = await fetch(`/api/contacts/${msgId}`, { method: 'DELETE' });
    const result = await response.json();
    if (response.ok && result.success) {
      loadAdminMessages();
    } else {
      alert(result.error || 'Erro ao eliminar mensagem.');
    }
  } catch (err) {
    console.error('Delete message error:', err);
    alert('Erro de comunicação.');
  }
}
