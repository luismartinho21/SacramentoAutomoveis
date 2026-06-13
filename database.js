const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, 'database.db');

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Helper function to hash password
function generateHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function initializeDatabase() {
  db.serialize(() => {
    // 1. Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err.message);
      else setupDefaultAdmin();
    });

    // 2. Create Vehicles Table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        version TEXT,
        price REAL NOT NULL,
        year INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        fuel TEXT NOT NULL,
        transmission TEXT NOT NULL,
        power INTEGER,
        engine_size INTEGER,
        color TEXT,
        description TEXT,
        features TEXT, -- JSON array string
        images TEXT,   -- JSON array string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating vehicles table:', err.message);
      else setupDefaultVehicles();
    });

    // 3. Create Inquiries Table
    db.run(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
      )
    `, (err) => {
      if (err) console.error('Error creating inquiries table:', err.message);
    });
  });
}

function setupDefaultAdmin() {
  const defaultUser = 'admin';
  const defaultPass = 'sacramento2026';

  db.get('SELECT * FROM users WHERE username = ?', [defaultUser], (err, row) => {
    if (err) {
      console.error('Error checking admin user:', err.message);
      return;
    }

    if (!row) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = generateHash(defaultPass, salt);

      db.run(
        'INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)',
        [defaultUser, hash, salt],
        (insertErr) => {
          if (insertErr) {
            console.error('Error inserting default admin user:', insertErr.message);
          } else {
            console.log('Default admin user created successfully.');
            console.log('Username: admin');
            console.log('Password: sacramento2026');
          }
        }
      );
    }
  });
}

function setupDefaultVehicles() {
  db.get('SELECT COUNT(*) AS count FROM vehicles', [], (err, row) => {
    if (err) {
      console.error('Error checking vehicles count:', err.message);
      return;
    }

    if (row && row.count === 0) {
      const defaultVehicles = [
        {
          brand: 'Ford',
          model: 'Fiesta',
          version: '1.6 TDCi Titanium',
          price: 12500,
          year: 2010,
          mileage: 185000,
          fuel: 'Diesel',
          transmission: 'Manual',
          power: 90,
          engine_size: 1560,
          color: 'Branco',
          description: 'Ford Fiesta 1.6 TDCi com 90cv de 2010. Viatura nacional muito económica e fiável, em excelente estado geral. Equipado com ar condicionado automático, jantes especiais de 15 polegadas, volante multifunções em pele, rádio leitor de CDs, faróis de nevoeiro e vidros elétricos. Um utilitário robusto e pronto a circular com consumos extraordinários.',
          features: JSON.stringify(["Ar Condicionado Automático Dual-Zone", "Jantes de Liga Leve Especial", "Bluetooth & Kit Mãos Livres"]),
          images: JSON.stringify(["ford-fiesta-1.jpg", "ford-fiesta-2.jpg"])
        },
        {
          brand: 'Renault',
          model: 'Megane Break',
          version: '1.5 dCi Dynamique',
          price: 10900,
          year: 2011,
          mileage: 215000,
          fuel: 'Diesel',
          transmission: 'Manual',
          power: 110,
          engine_size: 1461,
          color: 'Preto',
          description: 'Renault Megane Sport Tourer (Break) 1.5 dCi de 110cv de 2011. Carrinha familiar muito espaçosa, confortável e de baixos consumos. Equipada com ar condicionado automático, jantes especiais, sensores de estacionamento traseiros, cruise control com limitador de velocidade, volante multifunções, faróis de nevoeiro e ligação Bluetooth.',
          features: JSON.stringify(["GPS / Sistema de Navegação", "Ar Condicionado Automático Dual-Zone", "Jantes de Liga Leve Especial", "Sensores de Estacionamento (F/T)", "Cruise Control Adaptativo", "Bluetooth & Kit Mãos Livres"]),
          images: JSON.stringify(["renault-megane-1.jpg", "renault-megane-2.jpg"])
        }
      ];

      const stmt = db.prepare(`
        INSERT INTO vehicles (
          brand, model, version, price, year, mileage, fuel,
          transmission, power, engine_size, color, description, features, images
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      defaultVehicles.forEach(car => {
        stmt.run([
          car.brand, car.model, car.version, car.price, car.year, car.mileage, car.fuel,
          car.transmission, car.power, car.engine_size, car.color, car.description, car.features, car.images
        ], (err) => {
          if (err) console.error('Error seeding vehicle:', err.message);
        });
      });

      stmt.finalize(() => {
        console.log('Database pre-populated with default premium vehicles.');
      });
    }
  });
}


// Wrapper utility functions for database queries (promisified)
const dbQuery = {
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  generateHash,
  dbInstance: db
};

module.exports = dbQuery;
