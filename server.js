const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup session storage in-memory for admin
const sessions = {};

// Ensure upload directory exists
const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, 'public', 'uploads', 'vehicles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/vehicles', express.static(uploadDir));

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas são permitidas imagens (jpeg, jpg, png, webp, gif)!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Admin Authorization Middleware
function requireAdmin(req, res, next) {
  const token = req.cookies.session_token;
  if (token && sessions[token] && sessions[token].expires > Date.now()) {
    // Extend session expiration
    sessions[token].expires = Date.now() + 24 * 60 * 60 * 1000;
    req.user = sessions[token];
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado. Faça login como administrador.' });
  }
}

// --- AUTHENTICATION ENDPOINTS ---

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const hash = db.generateHash(password, user.salt);
    if (hash === user.password_hash) {
      // Create session token
      const token = crypto.randomBytes(32).toString('hex');
      sessions[token] = {
        username: user.username,
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };

      // Set cookie
      res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.json({ success: true, username: user.username });
    } else {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// Admin Logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies.session_token;
  if (token) {
    delete sessions[token];
    res.clearCookie('session_token');
  }
  res.json({ success: true });
});

// Check Session Status
app.get('/api/auth/session', (req, res) => {
  const token = req.cookies.session_token;
  if (token && sessions[token] && sessions[token].expires > Date.now()) {
    return res.json({ loggedIn: true, username: sessions[token].username });
  }
  res.json({ loggedIn: false });
});

// --- VEHICLES API ENDPOINTS ---

// GET list of vehicles (client catalog and admin panel, supports filters)
app.get('/api/cars', async (req, res) => {
  try {
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    // Filter by Search Query (Brand or Model)
    if (req.query.search) {
      sql += ' AND (brand LIKE ? OR model LIKE ? OR version LIKE ?)';
      const searchVal = `%${req.query.search}%`;
      params.push(searchVal, searchVal, searchVal);
    }

    // Filter by Brand
    if (req.query.brand) {
      sql += ' AND brand = ?';
      params.push(req.query.brand);
    }

    // Filter by Fuel Type
    if (req.query.fuel) {
      sql += ' AND fuel = ?';
      params.push(req.query.fuel);
    }

    // Filter by Transmission
    if (req.query.transmission) {
      sql += ' AND transmission = ?';
      params.push(req.query.transmission);
    }

    // Filter by Minimum Price
    if (req.query.minPrice) {
      sql += ' AND price >= ?';
      params.push(parseFloat(req.query.minPrice));
    }

    // Filter by Maximum Price
    if (req.query.maxPrice) {
      sql += ' AND price <= ?';
      params.push(parseFloat(req.query.maxPrice));
    }

    // Filter by Minimum Year
    if (req.query.minYear) {
      sql += ' AND year >= ?';
      params.push(parseInt(req.query.minYear));
    }

    // Filter by Maximum Year
    if (req.query.maxYear) {
      sql += ' AND year <= ?';
      params.push(parseInt(req.query.maxYear));
    }

    // Sorting
    const sortBy = req.query.sort || 'newest';
    if (sortBy === 'price_asc') {
      sql += ' ORDER BY price ASC';
    } else if (sortBy === 'price_desc') {
      sql += ' ORDER BY price DESC';
    } else if (sortBy === 'year_desc') {
      sql += ' ORDER BY year DESC';
    } else if (sortBy === 'mileage_asc') {
      sql += ' ORDER BY mileage ASC';
    } else {
      sql += ' ORDER BY created_at DESC'; // default newest listings
    }

    const cars = await db.all(sql, params);
    
    // Parse JSON strings back to arrays
    const parsedCars = cars.map(car => ({
      ...car,
      features: car.features ? JSON.parse(car.features) : [],
      images: car.images ? JSON.parse(car.images) : []
    }));

    res.json(parsedCars);
  } catch (err) {
    console.error('Error fetching cars:', err);
    res.status(500).json({ error: 'Erro ao obter lista de veículos.' });
  }
});

// GET unique filter options (brands, fuel types, transmission types)
app.get('/api/cars/filters', async (req, res) => {
  try {
    const brands = await db.all('SELECT DISTINCT brand FROM vehicles ORDER BY brand ASC');
    const fuels = await db.all('SELECT DISTINCT fuel FROM vehicles ORDER BY fuel ASC');
    const transmissions = await db.all('SELECT DISTINCT transmission FROM vehicles ORDER BY transmission ASC');

    res.json({
      brands: brands.map(b => b.brand),
      fuels: fuels.map(f => f.fuel),
      transmissions: transmissions.map(t => t.transmission)
    });
  } catch (err) {
    console.error('Error fetching filters:', err);
    res.status(500).json({ error: 'Erro ao obter opções de filtros.' });
  }
});

// GET single vehicle details
app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!car) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    const parsedCar = {
      ...car,
      features: car.features ? JSON.parse(car.features) : [],
      images: car.images ? JSON.parse(car.images) : []
    };

    res.json(parsedCar);
  } catch (err) {
    console.error('Error fetching car detail:', err);
    res.status(500).json({ error: 'Erro ao obter detalhes do veículo.' });
  }
});

// POST Add new vehicle (Admin only)
app.post('/api/cars', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const {
      brand, model, version, price, year, mileage, fuel,
      transmission, power, engine_size, color, description, features
    } = req.body;

    if (!brand || !model || !price || !year || !mileage || !fuel || !transmission) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
    }

    // Process uploaded file names
    const imageUrls = req.files ? req.files.map(file => file.filename) : [];

    // Parse features array
    let parsedFeatures = [];
    if (features) {
      parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
    }

    const result = await db.run(`
      INSERT INTO vehicles (
        brand, model, version, price, year, mileage, fuel,
        transmission, power, engine_size, color, description, features, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      brand, model, version || '', parseFloat(price), parseInt(year), parseInt(mileage),
      fuel, transmission, power ? parseInt(power) : null, engine_size ? parseInt(engine_size) : null,
      color || '', description || '', JSON.stringify(parsedFeatures), JSON.stringify(imageUrls)
    ]);

    res.status(201).json({ success: true, id: result.id });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ error: 'Erro ao adicionar o veículo.' });
  }
});

// PUT Update existing vehicle (Admin only)
app.put('/api/cars/:id', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const carId = req.params.id;
    const existingCar = await db.get('SELECT * FROM vehicles WHERE id = ?', [carId]);
    if (!existingCar) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    const {
      brand, model, version, price, year, mileage, fuel,
      transmission, power, engine_size, color, description, features, existing_images
    } = req.body;

    if (!brand || !model || !price || !year || !mileage || !fuel || !transmission) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
    }

    // Determine current images list
    let finalImages = [];
    
    // Parse images that the admin chose to keep
    if (existing_images) {
      finalImages = typeof existing_images === 'string' ? JSON.parse(existing_images) : existing_images;
    }

    // Add new uploaded files
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.filename);
      finalImages = [...finalImages, ...newImages];
    }

    // Identify and delete removed files from disk
    const oldImages = JSON.parse(existingCar.images || '[]');
    const deletedImages = oldImages.filter(img => !finalImages.includes(img));
    deletedImages.forEach(img => {
      const imgPath = path.join(uploadDir, img);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    });

    // Parse features
    let parsedFeatures = [];
    if (features) {
      parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
    }

    await db.run(`
      UPDATE vehicles SET 
        brand = ?, model = ?, version = ?, price = ?, year = ?, mileage = ?, 
        fuel = ?, transmission = ?, power = ?, engine_size = ?, color = ?, 
        description = ?, features = ?, images = ?
      WHERE id = ?
    `, [
      brand, model, version || '', parseFloat(price), parseInt(year), parseInt(mileage),
      fuel, transmission, power ? parseInt(power) : null, engine_size ? parseInt(engine_size) : null,
      color || '', description || '', JSON.stringify(parsedFeatures), JSON.stringify(finalImages),
      carId
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ error: 'Erro ao atualizar o veículo.' });
  }
});

// DELETE vehicle (Admin only)
app.delete('/api/cars/:id', requireAdmin, async (req, res) => {
  try {
    const carId = req.params.id;
    const car = await db.get('SELECT * FROM vehicles WHERE id = ?', [carId]);
    
    if (!car) {
      return res.status(404).json({ error: 'Veículo não encontrado.' });
    }

    // Delete associated images from disk
    const images = JSON.parse(car.images || '[]');
    images.forEach(img => {
      const imgPath = path.join(uploadDir, img);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    });

    // Delete database records
    await db.run('DELETE FROM vehicles WHERE id = ?', [carId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ error: 'Erro ao eliminar o veículo.' });
  }
});

// --- CONTACT INQUIRIES API ENDPOINTS ---

// POST Submit client contact inquiry
app.post('/api/contact', async (req, res) => {
  const { vehicle_id, name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nome, Email e Mensagem são obrigatórios.' });
  }

  try {
    // Check if vehicle exists if vehicle_id is provided
    if (vehicle_id) {
      const car = await db.get('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
      if (!car) {
        return res.status(400).json({ error: 'Veículo de referência inválido.' });
      }
    }

    await db.run(`
      INSERT INTO inquiries (vehicle_id, name, email, phone, message)
      VALUES (?, ?, ?, ?, ?)
    `, [vehicle_id || null, name, email, phone || '', message]);

    res.status(201).json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err) {
    console.error('Error inserting inquiry:', err);
    res.status(500).json({ error: 'Erro ao enviar a sua mensagem. Tente novamente mais tarde.' });
  }
});

// GET all inquiries (Admin only)
app.get('/api/contacts', requireAdmin, async (req, res) => {
  try {
    // Select inquiries and join vehicle details if available
    const sql = `
      SELECT i.*, v.brand, v.model, v.version, v.year, v.price
      FROM inquiries i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      ORDER BY i.created_at DESC
    `;
    const inquiries = await db.all(sql);
    res.json(inquiries);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ error: 'Erro ao obter mensagens.' });
  }
});

// PUT update inquiry status (Admin only)
app.put('/api/contacts/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'read', 'archived'].includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }

  try {
    const result = await db.run('UPDATE inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating inquiry status:', err);
    res.status(500).json({ error: 'Erro ao atualizar estado da mensagem.' });
  }
});

// DELETE inquiry (Admin only)
app.delete('/api/contacts/:id', requireAdmin, async (req, res) => {
  try {
    const result = await db.run('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting inquiry:', err);
    res.status(500).json({ error: 'Erro ao eliminar a mensagem.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
