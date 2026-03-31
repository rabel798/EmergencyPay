import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      balance REAL DEFAULT 1000.0,
      emergency_balance REAL DEFAULT 500.0,
      keypair TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      transaction_type TEXT DEFAULT 'online',
      description TEXT,
      signature TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users (id),
      FOREIGN KEY (receiver_id) REFERENCES users (id)
    )
  `);

  // Merchants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      category TEXT,
      is_essential BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Stablecoin balances table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stablecoin_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      usdc_balance REAL DEFAULT 0.0,
      usdt_balance REAL DEFAULT 0.0,
      dai_balance REAL DEFAULT 0.0,
      eurc_balance REAL DEFAULT 0.0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Stablecoin transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stablecoin_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      transaction_type TEXT,
      from_currency TEXT,
      to_currency TEXT,
      from_amount REAL,
      to_amount REAL,
      exchange_rate REAL,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Insert default data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, phone, balance, emergency_balance) 
      VALUES (?, ?, ?, ?)
    `);
    
    insertUser.run('Rahul Kumar', '9876543210', 2500.0, 500.0);
    insertUser.run('MedPlus Pharmacy', '9876543211', 5000.0, 1000.0);

    const getMedPlusId = db.prepare(`
      SELECT id FROM users WHERE phone = '9876543211'
    `).get() as { id: number };

    const insertMerchant = db.prepare(`
      INSERT INTO merchants (user_id, name, category, is_essential) 
      VALUES (?, ?, ?, ?)
    `);
    
    insertMerchant.run(getMedPlusId.id, 'MedPlus Pharmacy', 'Healthcare', 1);
  }
}

initDb();

// Connection status management
const CONNECTION_STATUS_FILE = path.join(__dirname, '..', 'connection-status.json');

function loadConnectionStatus(): string {
  try {
    if (fs.existsSync(CONNECTION_STATUS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONNECTION_STATUS_FILE, 'utf-8'));
      return data.status || 'online';
    }
  } catch (error) {
    console.error('Error loading connection status:', error);
  }
  return 'online';
}

function saveConnectionStatus(status: string) {
  fs.writeFileSync(CONNECTION_STATUS_FILE, JSON.stringify({ status }));
}

// Routes
app.get('/', (req, res) => {
  const distPath = path.join(__dirname, '..', 'dist', 'public', 'index.html');
  res.sendFile(distPath);
});

app.get('/api/user', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = 1').get() as any;
  
  if (user) {
    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      balance: user.balance,
      emergency_balance: user.emergency_balance
    });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.patch('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const { balance, emergency_balance } = req.body;

  try {
    if (balance !== undefined) {
      db.prepare('UPDATE users SET balance = ? WHERE id = ?').run(balance, userId);
    }
    if (emergency_balance !== undefined) {
      db.prepare('UPDATE users SET emergency_balance = ? WHERE id = ?').run(emergency_balance, userId);
    }

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    
    if (updatedUser) {
      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        balance: updatedUser.balance,
        emergency_balance: updatedUser.emergency_balance,
        message: 'User updated successfully'
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/merchants', (req, res) => {
  const merchants = db.prepare(`
    SELECT id, user_id, name, category, is_essential 
    FROM merchants
  `).all() as any[];

  res.json(merchants.map(m => ({
    id: m.id,
    user_id: m.user_id,
    name: m.name,
    category: m.category,
    is_essential: Boolean(m.is_essential)
  })));
});

app.get('/api/transactions/:user_id', (req, res) => {
  const userId = parseInt(req.params.user_id);
  const transactions = db.prepare(`
    SELECT t.*, u1.name as sender_name, u2.name as receiver_name
    FROM transactions t
    LEFT JOIN users u1 ON t.sender_id = u1.id
    LEFT JOIN users u2 ON t.receiver_id = u2.id
    WHERE t.sender_id = ? OR t.receiver_id = ?
    ORDER BY t.created_at DESC
  `).all(userId, userId) as any[];

  res.json(transactions.map(t => ({
    id: t.id,
    sender_id: t.sender_id,
    receiver_id: t.receiver_id,
    amount: t.amount,
    status: t.status,
    transaction_type: t.transaction_type,
    description: t.description,
    created_at: t.created_at,
    sender_name: t.sender_name,
    receiver_name: t.receiver_name
  })));
});

app.post('/api/transaction', (req, res) => {
  const { sender_id, receiver_id, amount, status = 'completed', transaction_type = 'online', description = '' } = req.body;

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (sender_id, receiver_id, amount, status, transaction_type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insertTransaction.run(sender_id, receiver_id, amount, status, transaction_type, description);
  const transactionId = result.lastInsertRowid;

  // Update balances if completed
  if (status === 'completed') {
    db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount, sender_id);
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, receiver_id);
  }

  // Emit real-time update
  io.emit('transaction_update', {
    transaction_id: transactionId,
    status: status
  });

  res.json({ id: transactionId, status: 'success' });
});

app.get('/api/system/network-status', (req, res) => {
  const status = loadConnectionStatus();
  res.json({ status });
});

app.post('/api/system/network-status', (req, res) => {
  const status = req.body.status || 'online';
  saveConnectionStatus(status);

  // Emit to all connected clients
  io.emit('network_status_changed', { status });

  res.json({ status });
});

// Toggle network status (for emergency mode)
app.post('/api/system/toggle-network', (req, res) => {
  const status = req.body.status || 'online';
  saveConnectionStatus(status);

  // Emit to all connected clients
  io.emit('network_status_changed', { status });

  res.json({ status, message: `Network status changed to: ${status}` });
});

app.post('/api/bluetooth/scan', (req, res) => {
  // Simulate bluetooth device discovery
  const devices = [
    { id: 'device_1', name: 'Priya Sharma', distance: 2.3 },
    { id: 'device_2', name: 'Amit Patel', distance: 4.1 },
    { id: 'device_3', name: 'Deepak Store', distance: 1.8 }
  ];
  res.json(devices);
});

app.post('/api/bluetooth/payment', (req, res) => {
  const { sender_id, amount, receiver_name } = req.body;

  const transactionData = {
    id: crypto.randomInt(10000),
    sender_id,
    receiver_id: 999,
    amount,
    status: 'pending_sync',
    transaction_type: 'bluetooth',
    description: `Bluetooth payment to ${receiver_name || 'Unknown'}`
  };

  // Store in database
  const insertTransaction = db.prepare(`
    INSERT INTO transactions (sender_id, receiver_id, amount, status, transaction_type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTransaction.run(
    transactionData.sender_id,
    transactionData.receiver_id,
    transactionData.amount,
    transactionData.status,
    transactionData.transaction_type,
    transactionData.description
  );

  res.json(transactionData);
});

// Stablecoin endpoints
app.get('/api/stablecoin/rates', async (req, res) => {
  try {
    // Real-time prices from CoinGecko (free API, no key required)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,tether,dai,euro-coin&vs_currencies=usd,inr,eur,gbp,jpy,aud,cad,chf,cny,sek&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&precision=8'
    );
    const prices = await response.json();

    res.json({
      usdc: prices['usd-coin'] || {},
      usdt: prices['tether'] || {},
      dai: prices['dai'] || {},
      eurc: prices['euro-coin'] || {},
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stablecoin rates:', error);
    // Return cached rates on error
    res.json({
      error: 'Failed to fetch rates',
      usdc: { usd: 1, inr: 83.5 },
      usdt: { usd: 1, inr: 83.5 },
      dai: { usd: 1, inr: 83.5 },
      eurc: { eur: 1, usd: 1.08, inr: 90.0 }
    });
  }
});

app.get('/api/stablecoin/balance/:user_id', (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  let balance = db.prepare('SELECT * FROM stablecoin_balances WHERE user_id = ?').get(userId) as any;
  
  if (!balance) {
    // Create balance entry if doesn't exist
    db.prepare(`
      INSERT INTO stablecoin_balances (user_id, usdc_balance, usdt_balance, dai_balance, eurc_balance)
      VALUES (?, 0, 0, 0, 0)
    `).run(userId);
    
    balance = {
      usdc_balance: 0,
      usdt_balance: 0,
      dai_balance: 0,
      eurc_balance: 0
    };
  }

  res.json(balance);
});

app.post('/api/stablecoin/convert', (req, res) => {
  const { user_id, from_currency, to_currency, from_amount, exchange_rate } = req.body;

  if (!from_currency || !to_currency || !from_amount || !exchange_rate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const to_amount = (from_amount * exchange_rate).toFixed(8);

  // Get or create stablecoin balance
  let balance = db.prepare('SELECT * FROM stablecoin_balances WHERE user_id = ?').get(user_id) as any;
  
  if (!balance) {
    db.prepare(`
      INSERT INTO stablecoin_balances (user_id, usdc_balance, usdt_balance, dai_balance, eurc_balance)
      VALUES (?, 0, 0, 0, 0)
    `).run(user_id);
    balance = { usdc_balance: 0, usdt_balance: 0, dai_balance: 0, eurc_balance: 0 };
  }

  // Map currency codes to table columns
  const currencyMap: any = {
    'USDC': 'usdc_balance',
    'USDT': 'usdt_balance',
    'DAI': 'dai_balance',
    'EURC': 'eurc_balance'
  };

  const fromCol = currencyMap[from_currency.toUpperCase()];
  const toCol = currencyMap[to_currency.toUpperCase()];

  if (!fromCol || !toCol) {
    return res.status(400).json({ error: 'Invalid currency' });
  }

  // Check if user has enough balance in from_currency
  if (balance[fromCol] < from_amount) {
    return res.status(400).json({ error: 'Insufficient stablecoin balance' });
  }

  // Update balances
  db.prepare(`
    UPDATE stablecoin_balances 
    SET ${fromCol} = ${fromCol} - ?, ${toCol} = ${toCol} + ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(from_amount, to_amount, user_id);

  // Record transaction
  db.prepare(`
    INSERT INTO stablecoin_transactions (user_id, transaction_type, from_currency, to_currency, from_amount, to_amount, exchange_rate, status)
    VALUES (?, 'conversion', ?, ?, ?, ?, ?, 'completed')
  `).run(user_id, from_currency, to_currency, from_amount, to_amount, exchange_rate);

  res.json({
    success: true,
    from_currency,
    to_currency,
    from_amount,
    to_amount,
    exchange_rate,
    message: `Converted ${from_amount} ${from_currency} to ${to_amount} ${to_currency}`
  });
});

app.post('/api/stablecoin/deposit', (req, res) => {
  const { user_id, stablecoin, amount } = req.body;

  if (!stablecoin || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid stablecoin or amount' });
  }

  const currencyMap: any = {
    'USDC': 'usdc_balance',
    'USDT': 'usdt_balance',
    'DAI': 'dai_balance',
    'EURC': 'eurc_balance'
  };

  const col = currencyMap[stablecoin.toUpperCase()];
  if (!col) {
    return res.status(400).json({ error: 'Invalid stablecoin' });
  }

  // Ensure balance entry exists
  const existing = db.prepare('SELECT id FROM stablecoin_balances WHERE user_id = ?').get(user_id);
  if (!existing) {
    db.prepare(`
      INSERT INTO stablecoin_balances (user_id, usdc_balance, usdt_balance, dai_balance, eurc_balance)
      VALUES (?, 0, 0, 0, 0)
    `).run(user_id);
  }

  // Add stablecoin
  db.prepare(`
    UPDATE stablecoin_balances 
    SET ${col} = ${col} + ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(amount, user_id);

  res.json({
    success: true,
    stablecoin,
    amount,
    message: `Deposited ${amount} ${stablecoin}`
  });
});

app.post('/api/stablecoin/withdraw', (req, res) => {
  const { user_id, stablecoin, amount } = req.body;

  if (!stablecoin || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid stablecoin or amount' });
  }

  const currencyMap: any = {
    'USDC': 'usdc_balance',
    'USDT': 'usdt_balance',
    'DAI': 'dai_balance',
    'EURC': 'eurc_balance'
  };

  const col = currencyMap[stablecoin.toUpperCase()];
  if (!col) {
    return res.status(400).json({ error: 'Invalid stablecoin' });
  }

  const balance = db.prepare('SELECT * FROM stablecoin_balances WHERE user_id = ?').get(user_id) as any;

  if (!balance || balance[col] < amount) {
    return res.status(400).json({ error: `Insufficient ${stablecoin} balance` });
  }

  // Withdraw stablecoin
  db.prepare(`
    UPDATE stablecoin_balances 
    SET ${col} = ${col} - ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(amount, user_id);

  res.json({
    success: true,
    stablecoin,
    amount,
    message: `Withdrawn ${amount} ${stablecoin}`
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.emit('network_status', { status: loadConnectionStatus() });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`EmergencyPay server running on http://0.0.0.0:${PORT}`);
});