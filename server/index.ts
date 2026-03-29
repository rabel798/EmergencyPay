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