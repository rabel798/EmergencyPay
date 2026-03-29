# **EmergencyPay - Offline Payment System with Stablecoin Transactions**

## **Overview**

EmergencyPay is a React-based web application that enables offline payments with real stablecoin support during network outages. The system provides both merchant and customer interfaces with offline transaction capabilities, stablecoin conversion (with real-time exchange rates), and device-to-device payments using simulated Bluetooth.

# **🏗️ System Architecture**

## **Backend**
- **Runtime**: Node.js with Express.js framework
- **Database**: SQLite with better-sqlite3 driver
- **Real-time Communication**: Socket.IO for live updates
- **External APIs**: CoinGecko for real-time stablecoin prices
- **Authentication**: Firebase Auth (optional, configurable)

## **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API with custom AppContext
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack Query for server state management
- **Animations**: Framer Motion for smooth transitions

## **💎 Stablecoin Features**
- **Real Stablecoins Supported**: USDC, USDT, DAI, EURC, and more
- **Real-time Pricing**: CoinGecko API (free, no key required)
- **Multi-currency Support**: Convert between 100+ fiat currencies
- **Zero Conversion Fees**: No charges on conversions
- **Persistent Storage**: SQLite database (not Firebase)
- **Offline Capability**: Queue transactions during outages, sync when online

# **🚀 Quick Start**

## **🧱 Step 1: Clone the Repository**
```bash
git clone https://github.com/rabel798/EmergencyPay
cd EmergencyPay
```

## **📦 Step 2: Install Dependencies**
```bash
npm install
```

## **⚙ Step 3: Create .env File**
In the project root directory, create a `.env` file:

```env
# Server config
PORT=3000

# Firebase (Optional - leave empty to skip Firebase auth)
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id

# CoinGecko API (free tier, no key needed)
VITE_COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

## **🎯 Step 4: Build & Run**

### Development Mode (with hot reload)
```bash
npm run dev
```
Access at: http://localhost:3000

### Production Mode
```bash
npm run build
npm start
```

   ### PostgreSQL database config
      - DATABASE_URL=postgresql://neondb_owner:npg_m0JGs4tCgoTe@ep-tiny-fog-a6wso9s2.us-west-2.aws.neon.tech/neondb?sslmode=require
      - PGDATABASE=neondb
      - PGHOST=ep-tiny-fog-a6wso9s2.us-west-2.aws.neon.tech
      - PGPORT=5432
      - PGUSER=neondb_owner
      - PGPASSWORD=npg_m0JGs4tCgoTe

 ## **🏃‍♂ Step 5: Run the Application**
   ### Build frontend and run everything (Production mode):
      - npm run build      # Builds the frontend
      - python app.py      # Starts the Flask backend

   ### OR run in development mode:
       npm start

   ### OR run Flask directly:
       python app.py

 # **🌐 Access the Application**
      - Development: http://localhost:3000
      - The app will build the frontend and start the Flask server
 
 # **📱 Key Features:**

  ## 🌐 Connection Management
    - **Online Mode**: Real-time UPI-like transactions
    - **Offline Mode**: Bluetooth-simulated peer-to-peer payments
    - **Emergency Mode**: Special offline capabilities for essential services
    - **Auto-detection**: Automatic switching based on network status

  ## 💳 Payment Processing
    - **Digital Wallet**: Regular and emergency balance management
    - **QR Code Scanning**: Simulated merchant payment flows
    - **Bluetooth Payments**: Device-to-device offline transactions
    - **Transaction History**: Comprehensive payment tracking
    - **Offline Sync**: Reconciliation when connectivity restored

  ## 🏥 Emergency Services
    - **Essential Merchants**: Priority access to healthcare, groceries, transport
  - **Emergency Balance**: Reserved funds for critical situations
  - **Offline Capabilities**: Payments without internet connectivity
  - **Digital Signatures**: Cryptographic transaction security

# **🗂️ Project Structure**

    EmergencyPay/
     ├── client/                    # React frontend
     │   ├── src/
     │   │   ├── components/        # Reusable UI components
     │   │   ├── pages/            # Application pages
     │   │   ├── context/          # State management
     │   │   └── lib/              # Utilities and services
     ├── server/                   # Node.js wrapper for compatibility
     ├── app.py                    # Main Flask application
     ├── database.db              # SQLite database (auto-created)
     ├── requirements.txt          # Python dependencies
     ├── package.json             # Node.js dependencies
     └── .env                     # Environment variables (create this)

# **🔄 Data Flow**

 ## Online Transaction Flow
    - User initiates payment via QR scan or merchant selection
    - Frontend validates amount and balance
    - Flask backend processes payment through banking simulation
    - Real-time updates via Socket.IO
    - Transaction recorded in PostgreSQL database 

 ## Offline Transaction Flow
    - Emergency mode activated (manual or automatic)
    - Bluetooth device discovery initiated
    - Peer-to-peer connection established
    - Transaction signed with digital signature
    - Local storage with pending sync status
    - Reconciliation when connectivity restored

# **📊 Database Schema**
 ## Users Table
     - User profiles and authentication
     - Digital keypairs for signatures
     - Regular and emergency balances

 ## Transactions Table
     - Payment records with status tracking
     - Online/offline transaction metadata
     - Digital signatures and verification
  
 ## Merchants Table
     - Merchant profiles and categories
     - Essential service flags
     - Payment acceptance preferences

# **🔐 Security Features**
    - **Digital Signatures**: Cryptographic transaction signing
    - **Session Management**: Secure Flask sessions with pre-configured secrets
    - **Input Validation**: Comprehensive data sanitization
    - **Offline Security**: Local transaction verification
    - **Emergency Protocols**: Secure offline payment processing
    - **Database Security**: PostgreSQL with SSL connections

# **🛠️ Development**
  ## **Local Development**
   ### Frontend development with hot reload
    npm run dev

   ### Backend development
    python app.py

  ## **Production Build**
   ### Build frontend
     npm run build

   ### Start production server
    npm start
 
  ## **Testing Database Connection**
    python -c "import psycopg2; print('Database connection successful!')"

# **🚀 Deployment**
  ## Ready-to-Deploy Configuration
     - The application comes pre-configured with:
     - PostgreSQL database credentials (Neon cloud database)
     - Session security keys
     -  Production-ready environment variables
  
  ## Deploy Steps
     - Environment variables are already configured
     - Build the frontend: npm run build
     - Start the Flask server: python app.py
     -  Application will be accessible on the configured port
  
  ## Database Information
     - Provider: Neon (Serverless PostgreSQL)
     - Region: US West 2 (AWS)
     - SSL: Required and configured
     - Connection Pooling: Enabled

# **🔍 Troubleshooting**
  ## Common Issues
     - Database Connection: Pre-configured with Neon PostgreSQL - should work out of the box
     - Session Management: SESSION_SECRET is pre-configured
     - Port Conflicts: Change PORT environment variable if needed
     - SSL Issues: Database uses SSL by default (sslmode=require)

  ## **Verify Setup**
   ### Check environment variables:
      printenv | grep -E "(SESSION_SECRET|DATABASE_URL|PG)"

   ### Test database connection:
    python -c 
     "
     import os
     import psycopg2
     try:
         conn = psycopg2.connect(os.environ['DATABASE_URL'])
         print('✓ Database connection successful')
         conn.close()
     except Exception as e:
         print(f'✗ Database connection failed: {e}')
     "

# **📄 License**
 MIT License - see LICENSE file for details

# **🤝 Contributing**
 - Fork the repository
 - **Create a feature branch**: git checkout -b feature-name
 - **Commit your changes**: git commit -m 'Add feature'
 - **Push to the branch**: git push origin feature-name
 - Open a pull request

# **📞 Support**
 ## For issues and questions:

 - Create an issue in the GitHub repository
 - Check the troubleshooting section above
 - Verify environment variables are correctly set

**Note: This is a simulation system for demonstration purposes. Do not use for actual financial transactions. The database credentials provided are for demonstration and should be rotated for production use.**


