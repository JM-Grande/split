/* eslint-disable @typescript-eslint/no-require-imports */
process.env.NODE_NO_WARNINGS = '1';
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const next = require('next');
const crypto = require('crypto');

// Determine if we are in development mode
const dev = !app.isPackaged;
if (!dev) {
  process.env.NODE_ENV = 'production';
}

// Set up SQLite database in the user's persistent write-enabled folder
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'dev.db');

console.log('Database path:', dbPath);

// Ensure the SQLite database exists in the userData directory.
// In production, we copy our empty template database so the user starts fresh.
const bundledDbPath = path.join(__dirname, 'prisma', 'template.db');
async function initializeApp() {
  try {
    await fs.promises.access(dbPath);
  } catch {
    try {
      await fs.promises.mkdir(userDataPath, { recursive: true });
      try {
        await fs.promises.access(bundledDbPath);
        await fs.promises.copyFile(bundledDbPath, dbPath);
        console.log('Database template copied to userData folder successfully.');
      } catch {
        console.warn('Bundled template database not found at:', bundledDbPath);
        // SQLite will automatically create an empty db, but tables won't exist.
      }
    } catch (err) {
      console.error('Failed to copy template database:', err);
    }
  }

  // Override Prisma's database URL to point to the persistent file
  process.env.DATABASE_URL = `file:${dbPath}`;

  // Set up unique NextAuth secret per installation
  const configPath = path.join(userDataPath, 'config.json');
  let authSecret;

  try {
    await fs.promises.access(configPath);
    try {
      const configData = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
      authSecret = configData.AUTH_SECRET;
    } catch (err) {
      console.error('Failed to read config.json, generating new secret.', err);
    }
  } catch {
    // config.json does not exist
  }

  if (!authSecret) {
    authSecret = crypto.randomBytes(32).toString('hex');
    try {
      let configData = {};
      try {
        await fs.promises.access(configPath);
        configData = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
      } catch {
        // config.json does not exist
      }
      configData.AUTH_SECRET = authSecret;
      await fs.promises.writeFile(configPath, JSON.stringify(configData, null, 2));
      console.log('Generated new unique AUTH_SECRET and saved to config.json');
    } catch (err) {
      console.error('Failed to write config.json:', err);
    }
  }

  process.env.AUTH_SECRET = process.env.AUTH_SECRET || authSecret;
  process.env.AUTH_TRUST_HOST = 'true';
}

let nextApp;
let handle;
let mainWindow;

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#111318', // Matching DESIGN.md base background
    title: 'Split',
    show: false,
  });

  // Remove default menu bar in production
  if (!dev) {
    mainWindow.setMenu(null);
  }

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  await initializeApp();
  nextApp = next({ dev, dir: __dirname });
  handle = nextApp.getRequestHandler();

  nextApp.prepare().then(() => {
    const server = createServer((req, res) => {
      handle(req, res);
    });
    
    server.listen(0, (err) => {
      if (err) throw err;
      const port = server.address().port;
      
      console.log(`> Server ready on http://localhost:${port}`);
      createWindow(port);
    });
  }).catch((err) => {
    console.error('Failed to initialize Next.js server:', err);
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    // If activated again, we might not have the port readily available if not stored globally.
    // It's better to rely on Next.js server still running.
    // However, on Windows this rarely happens. We can store the port globally.
    // Actually, we can just use the global server port if we save it.
  }
});
