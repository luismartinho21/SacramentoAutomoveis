let currentCars = [];
let modalCarImages = [];
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadFilters();
  loadCars();

  // Filter Event Listeners
  document.getElementById('btn-apply-filters').addEventListener('click', applyFilters);
  document.getElementById('btn-clear-filters').addEventListener('click', clearFilters);
  document.getElementById('sort-by').addEventListener('change', applyFilters);

  // General Contact Form
  const generalForm = document.getElementById('general-contact-form');
  if (generalForm) {
    generalForm.addEventListener('submit', handleGeneralContact);
  }

  // Modal Setup
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Close modal when clicking backdrop
  const carModal = document.getElementById('car-modal');
  if (carModal) {
    carModal.addEventListener('click', (e) => {
      if (e.target === carModal) closeModal();
    });
  }

  // Gallery Navigation
  document.getElementById('gallery-prev').addEventListener('click', prevImage);
  document.getElementById('gallery-next').addEventListener('click', nextImage);

  // Modal Contact Form
  const modalForm = document.getElementById('modal-contact-form');
  if (modalForm) {
    modalForm.addEventListener('submit', handleModalContact);
  }
});

// Load distinct values for filters from the API
async function loadFilters() {
  try {
    const response = await fetch('/api/cars/filters');
    const data = await response.json();

    const brandSelect = document.getElementById('filter-brand');
    const fuelSelect = document.getElementById('filter-fuel');
    const transSelect = document.getElementById('filter-transmission');

    // Populate Brands
    data.brands.forEach(brand => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      brandSelect.appendChild(opt);
    });

    // Populate Fuels
    data.fuels.forEach(fuel => {
      const opt = document.createElement('option');
      opt.value = fuel;
      opt.textContent = fuel;
      fuelSelect.appendChild(opt);
    });

    // Populate Transmissions
    data.transmissions.forEach(trans => {
      const opt = document.createElement('option');
      opt.value = trans;
      opt.textContent = trans;
      transSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading filter options:', err);
  }
}

// Fetch and display cars matching search filters
async function loadCars(queryString = '') {
  const grid = document.getElementById('vehicles-grid');
  const countEl = document.getElementById('catalog-count');
  
  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary);">
      <div style="display:inline-block; width: 30px; height: 30px; border: 3px solid rgba(255,255,255,0.1); border-radius: 50%; border-top-color: var(--accent); animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
      <p>A carregar viaturas...</p>
    </div>
  `;

  // Dynamic CSS animation spin keyframe injected if not present
  if (!document.getElementById('style-spin')) {
    const style = document.createElement('style');
    style.id = 'style-spin';
    style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  try {
    const response = await fetch(`/api/cars${queryString}`);
    currentCars = await response.json();

    // Update count label
    const carCount = currentCars.length;
    countEl.textContent = `${carCount} ${carCount === 1 ? 'viatura encontrada' : 'viaturas encontradas'}`;

    if (carCount === 0) {
      grid.innerHTML = `
        <div class="no-cars">
          <i data-lucide="car-front" style="width: 48px; height: 48px;"></i>
          <h3>Nenhum automóvel encontrado</h3>
          <p>Tente ajustar os seus filtros de pesquisa ou remover as opções selecionadas.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    grid.innerHTML = '';
    currentCars.forEach(car => {
      const card = createCarCard(car);
      grid.appendChild(card);
    });

    lucide.createIcons();
  } catch (err) {
    console.error('Error loading cars:', err);
    grid.innerHTML = `
      <div class="no-cars" style="border-color: #ef4444;">
        <i data-lucide="alert-circle" style="color: #ef4444; width: 48px; height: 48px;"></i>
        <h3>Erro de carregamento</h3>
        <p>Não foi possível comunicar com o servidor. Por favor, tente novamente.</p>
      </div>
    `;
    lucide.createIcons();
  }
}

// Generate the HTML elements for a single car card
function createCarCard(car) {
  const card = document.createElement('div');
  card.className = 'car-card';
  card.addEventListener('click', () => openCarDetails(car.id));

  // Determine cover image
  const coverImg = car.images && car.images.length > 0 
    ? `/uploads/vehicles/${car.images[0]}` 
    : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'; // high-quality placeholder fallback

  const formattedPrice = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price);
  const formattedMileage = new Intl.NumberFormat('pt-PT').format(car.mileage) + ' km';

  card.innerHTML = `
    <div class="car-image-container">
      <img src="${coverImg}" alt="${car.brand} ${car.model}" class="car-card-img" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'">
      <span class="car-tag">${car.year}</span>
      <span class="car-details-btn">Ver Detalhes</span>
    </div>
    <div class="car-card-content">
      <div class="car-brand-model">${car.brand} ${car.model}</div>
      <div class="car-version">${car.version || '&nbsp;'}</div>
      
      <div class="car-specs-grid">
        <div class="car-spec-item">
          <span class="car-spec-label"><i data-lucide="gauge" style="width:12px; height:12px; display:inline; vertical-align:middle; margin-right:4px;"></i>Kms</span>
          <span class="car-spec-value">${formattedMileage}</span>
        </div>
        <div class="car-spec-item">
          <span class="car-spec-label"><i data-lucide="fuel" style="width:12px; height:12px; display:inline; vertical-align:middle; margin-right:4px;"></i>Fuel</span>
          <span class="car-spec-value">${car.fuel}</span>
        </div>
        <div class="car-spec-item">
          <span class="car-spec-label"><i data-lucide="cog" style="width:12px; height:12px; display:inline; vertical-align:middle; margin-right:4px;"></i>Caixa</span>
          <span class="car-spec-value">${car.transmission}</span>
        </div>
      </div>
      
      <div class="car-price-row">
        <span class="car-price-label">Preço Comercial</span>
        <span class="car-price-value">${formattedPrice}</span>
      </div>
    </div>
  `;
  return card;
}

// Assemble query filters and refresh catalog list
function applyFilters() {
  const brand = document.getElementById('filter-brand').value;
  const fuel = document.getElementById('filter-fuel').value;
  const trans = document.getElementById('filter-transmission').value;
  const maxPrice = document.getElementById('filter-max-price').value;
  const sortBy = document.getElementById('sort-by').value;

  const params = new URLSearchParams();
  if (brand) params.append('brand', brand);
  if (fuel) params.append('fuel', fuel);
  if (trans) params.append('transmission', trans);
  if (maxPrice) params.append('maxPrice', maxPrice);
  if (sortBy) params.append('sort', sortBy);

  const query = params.toString() ? `?${params.toString()}` : '';
  loadCars(query);
}

// Reset all input filters
function clearFilters() {
  document.getElementById('filter-brand').value = '';
  document.getElementById('filter-fuel').value = '';
  document.getElementById('filter-transmission').value = '';
  document.getElementById('filter-max-price').value = '';
  document.getElementById('sort-by').value = 'newest';

  loadCars();
}

// Opens the details modal for a specific vehicle ID
async function openCarDetails(carId) {
  const backdrop = document.getElementById('car-modal');
  const modalFormSuccess = document.getElementById('modal-form-success');
  const modalFormError = document.getElementById('modal-form-error');

  // Reset alert states
  if (modalFormSuccess) modalFormSuccess.style.display = 'none';
  if (modalFormError) modalFormError.style.display = 'none';
  document.getElementById('modal-contact-form').reset();

  try {
    const response = await fetch(`/api/cars/${carId}`);
    if (!response.ok) throw new Error('Failed to fetch details');
    const car = await response.json();

    // Populate Fields
    document.getElementById('modal-car-id').value = car.id;
    document.getElementById('modal-title').textContent = `${car.brand} ${car.model}`;
    document.getElementById('modal-version').textContent = car.version || '';
    
    const formattedPrice = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(car.price);
    document.getElementById('modal-price').textContent = formattedPrice;

    // Specs
    document.getElementById('spec-year').textContent = car.year;
    document.getElementById('spec-mileage').textContent = new Intl.NumberFormat('pt-PT').format(car.mileage) + ' km';
    document.getElementById('spec-fuel').textContent = car.fuel;
    document.getElementById('spec-transmission').textContent = car.transmission;
    document.getElementById('spec-power').textContent = car.power ? `${car.power} cv` : '-';
    document.getElementById('spec-engine').textContent = car.engine_size ? `${new Intl.NumberFormat('pt-PT').format(car.engine_size)} cc` : '-';
    document.getElementById('spec-color').textContent = car.color || '-';

    // Description
    document.getElementById('modal-description').textContent = car.description || 'Nenhuma descrição fornecida para este veículo.';

    // Features tags
    const featuresContainer = document.getElementById('modal-features');
    featuresContainer.innerHTML = '';
    
    if (car.features && car.features.length > 0) {
      document.querySelector('.specs-section-title:nth-of-type(2)').style.display = 'block'; // Show title
      car.features.forEach(feat => {
        const span = document.createElement('span');
        span.className = 'feature-tag';
        span.innerHTML = `<i data-lucide="check-circle-2"></i> ${feat}`;
        featuresContainer.appendChild(span);
      });
    } else {
      document.querySelector('.specs-section-title:nth-of-type(2)').style.display = 'none'; // Hide title if empty
    }

    // Gallery Carousel setup
    modalCarImages = car.images && car.images.length > 0 
      ? car.images 
      : [];
    
    currentImageIndex = 0;
    setupGallery();

    // WhatsApp Action Button Setup
    const waBtn = document.getElementById('btn-modal-whatsapp');
    if (waBtn) {
      waBtn.onclick = () => {
        const text = encodeURIComponent(`Olá! Estou interessado na viatura ${car.brand} ${car.model} (${car.year}) anunciada por ${formattedPrice}. Gostaria de obter mais informações.`);
        window.open(`https://wa.me/351912345678?text=${text}`, '_blank');
      };
    }

    backdrop.classList.add('active');
    lucide.createIcons();
  } catch (err) {
    console.error('Error opening details modal:', err);
    alert('Erro ao carregar dados do automóvel.');
  }
}

// Close the details modal
function closeModal() {
  document.getElementById('car-modal').classList.remove('active');
}

// Gallery image switcher logic
function setupGallery() {
  const mainImg = document.getElementById('modal-gallery-img');
  const thumbsContainer = document.getElementById('modal-gallery-thumbs');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');

  thumbsContainer.innerHTML = '';

  if (modalCarImages.length === 0) {
    mainImg.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'; // fallback placeholder
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }

  // Display arrows only if there's more than 1 image
  const multiImg = modalCarImages.length > 1;
  prevBtn.style.display = multiImg ? 'flex' : 'none';
  nextBtn.style.display = multiImg ? 'flex' : 'none';

  // Set initial main image
  mainImg.src = `/uploads/vehicles/${modalCarImages[currentImageIndex]}`;
  mainImg.onerror = () => {
    mainImg.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';
  };

  // Build Thumbnails
  modalCarImages.forEach((img, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `thumb-item ${idx === currentImageIndex ? 'active' : ''}`;
    thumb.innerHTML = `<img src="/uploads/vehicles/${img}" alt="Miniatura ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=150'">`;
    thumb.addEventListener('click', () => {
      setCurrentImage(idx);
    });
    thumbsContainer.appendChild(thumb);
  });
}

function setCurrentImage(index) {
  currentImageIndex = index;
  const mainImg = document.getElementById('modal-gallery-img');
  mainImg.src = `/uploads/vehicles/${modalCarImages[currentImageIndex]}`;
  
  // Update thumbs styling
  const thumbs = document.querySelectorAll('#modal-gallery-thumbs .thumb-item');
  thumbs.forEach((thumb, idx) => {
    if (idx === currentImageIndex) thumb.classList.add('active');
    else thumb.classList.remove('active');
  });
}

function prevImage() {
  if (modalCarImages.length <= 1) return;
  let newIdx = currentImageIndex - 1;
  if (newIdx < 0) newIdx = modalCarImages.length - 1;
  setCurrentImage(newIdx);
}

function nextImage() {
  if (modalCarImages.length <= 1) return;
  let newIdx = currentImageIndex + 1;
  if (newIdx >= modalCarImages.length) newIdx = 0;
  setCurrentImage(newIdx);
}

// Handle client-specific car inquiry submission
async function handleModalContact(e) {
  e.preventDefault();
  
  const successEl = document.getElementById('modal-form-success');
  const errorEl = document.getElementById('modal-form-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  successEl.style.display = 'none';
  errorEl.style.display = 'none';
  submitBtn.disabled = true;

  const payload = {
    vehicle_id: document.getElementById('modal-car-id').value,
    name: document.getElementById('modal-input-name').value,
    email: document.getElementById('modal-input-email').value,
    phone: document.getElementById('modal-input-phone').value,
    message: document.getElementById('modal-input-message').value
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok && result.success) {
      successEl.style.display = 'block';
      e.target.reset();
    } else {
      errorEl.textContent = result.error || 'Erro ao submeter contacto.';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Error submitting contact form:', err);
    errorEl.textContent = 'Erro de ligação ao servidor.';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
  }
}

// Handle general contact submission
async function handleGeneralContact(e) {
  e.preventDefault();

  const successEl = document.getElementById('general-form-success');
  const errorEl = document.getElementById('general-form-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  successEl.style.display = 'none';
  errorEl.style.display = 'none';
  submitBtn.disabled = true;

  const payload = {
    name: document.getElementById('contact-name').value,
    email: document.getElementById('contact-email').value,
    phone: document.getElementById('contact-phone').value,
    message: document.getElementById('contact-message').value
  };

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok && result.success) {
      successEl.style.display = 'block';
      e.target.reset();
    } else {
      errorEl.textContent = result.error || 'Erro ao submeter mensagem.';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Error submitting general contact form:', err);
    errorEl.textContent = 'Erro de ligação ao servidor.';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
  }
}
