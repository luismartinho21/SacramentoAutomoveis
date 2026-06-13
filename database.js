const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const crypto = require('crypto');

let dbType = 'sqlite';
let pgPool = null;
let sqliteDb = null;

// Connect to Database based on environment
if (process.env.DATABASE_URL) {
  dbType = 'postgres';
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  console.log('Connected to PostgreSQL database.');
  initializeDatabase();
} else {
  dbType = 'sqlite';
  const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, 'database.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('Connected to SQLite database.');
      initializeDatabase();
    }
  });
}

// Helper to convert ? to $1, $2, etc. in PostgreSQL
function translateSql(sql) {
  if (dbType !== 'postgres') return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

async function initializeDatabase() {
  const isPG = dbType === 'postgres';
  const primaryKeyType = isPG ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampType = 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';

  try {
    // 1. Create Users Table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id ${primaryKeyType},
        username VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at ${timestampType}
      )
    `);
    await setupDefaultAdmin();

    // 2. Create Vehicles Table
    await run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id ${primaryKeyType},
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        version VARCHAR(150),
        price REAL NOT NULL,
        year INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        fuel VARCHAR(50) NOT NULL,
        transmission VARCHAR(50) NOT NULL,
        power INTEGER,
        engine_size INTEGER,
        color VARCHAR(100),
        description TEXT,
        features TEXT, -- JSON array string
        images TEXT,   -- JSON array string
        created_at ${timestampType}
      )
    `);
    await setupDefaultVehicles();

    // 3. Create Inquiries Table
    await run(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id ${primaryKeyType},
        vehicle_id INTEGER,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at ${timestampType},
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
      )
    `);
    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
  }
}

// Helper function to hash password
function generateHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

async function setupDefaultAdmin() {
  const defaultUser = 'VitorSacramento';
  const defaultPass = 'sacramento.2026';

  try {
    const row = await get('SELECT * FROM users WHERE username = ?', [defaultUser]);
    if (!row) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = generateHash(defaultPass, salt);

      await run(
        'INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)',
        [defaultUser, hash, salt]
      );
      console.log('Default admin user created successfully.');
      console.log('Username: ' + defaultUser);
      console.log('Password: ' + defaultPass);
    }
  } catch (err) {
    console.error('Error setting up default admin user:', err.message);
  }
}

async function setupDefaultVehicles() {
  try {
    const row = await get('SELECT COUNT(*) AS count FROM vehicles');
    const count = row ? (row.count !== undefined ? row.count : row.COUNT) : 0;
    
    if (parseInt(count) === 0) {
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

      for (const car of defaultVehicles) {
        await run(`
          INSERT INTO vehicles (
            brand, model, version, price, year, mileage, fuel,
            transmission, power, engine_size, color, description, features, images
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          car.brand, car.model, car.version, car.price, car.year, car.mileage, car.fuel,
          car.transmission, car.power, car.engine_size, car.color, car.description, car.features, car.images
        ]);
      }
      console.log('Database pre-populated with default vehicles.');
    }
  } catch (err) {
    console.error('Error setting up default vehicles:', err.message);
  }
}

// Wrapper utility functions for database queries (promisified)
function get(sql, params = []) {
  const finalSql = translateSql(sql);
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pgPool.query(finalSql, params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows && res.rows[0] ? res.rows[0] : null);
      });
    } else {
      sqliteDb.get(finalSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }
  });
}

function all(sql, params = []) {
  const finalSql = translateSql(sql);
  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pgPool.query(finalSql, params, (err, res) => {
        if (err) reject(err);
        else resolve(res.rows);
      });
    } else {
      sqliteDb.all(finalSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }
  });
}

function run(sql, params = []) {
  let finalSql = translateSql(sql);
  
  // PostgreSQL handles auto-generated IDs differently (requires RETURNING clause)
  if (dbType === 'postgres' && sql.trim().toUpperCase().startsWith('INSERT ')) {
    finalSql += ' RETURNING id';
  }

  return new Promise((resolve, reject) => {
    if (dbType === 'postgres') {
      pgPool.query(finalSql, params, (err, res) => {
        if (err) reject(err);
        else {
          const id = res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].insertid) : null;
          resolve({ id: id, changes: res.rowCount });
        }
      });
    } else {
      sqliteDb.run(finalSql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    }
  });
}

module.exports = {
  get,
  all,
  run,
  generateHash
};
