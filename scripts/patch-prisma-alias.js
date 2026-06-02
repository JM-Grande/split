/**
 * patch-prisma-alias.js
 *
 * Turbopack resolves `@prisma/client` through to `.prisma/client/package.json`
 * which has a content-hashed `name` field. It then emits external requires like:
 *   require('@prisma/client-2c3a283f134fdcb6')
 *
 * This module doesn't exist in node_modules at runtime, causing:
 *   "Failed to load external module @prisma/client-2c3a283f134fdcb6"
 *
 * This script:
 *   1. Scans .next/server/ chunks for the hashed alias pattern
 *   2. Creates node_modules/@prisma/client-HASH/ that re-exports .prisma/client
 *
 * Run automatically via "postbuild" in package.json after every `next build`.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, '.next', 'server');

function findHashes(dir) {
  let prismaHash = null;
  let sqliteHash = null;
  
  if (!fs.existsSync(dir)) return { prismaHash, sqliteHash };
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (!prismaHash) {
            const pMatch = content.match(/@prisma\/client-([a-f0-9]{8,})/);
            if (pMatch) prismaHash = pMatch[1];
          }
          if (!sqliteHash) {
            const sMatch = content.match(/better-sqlite3-([a-f0-9]{8,})/);
            if (sMatch) sqliteHash = sMatch[1];
          }
          if (prismaHash && sqliteHash) break;
        } catch { /* skip */ }
      }
    }
  }
  
  scan(serverDir);
  return { prismaHash, sqliteHash };
}

console.log('🔍 Scanning .next/server for Turbopack hashes...');
const { prismaHash, sqliteHash } = findHashes(serverDir);

if (prismaHash) {
  console.log(`   Found Prisma hash: @prisma/client-${prismaHash}`);
  const aliasDir = path.join(rootDir, 'node_modules', '@prisma', `client-${prismaHash}`);
  const actualDir = path.join(rootDir, 'node_modules', '.prisma', 'client');
  const relPath = path.relative(aliasDir, actualDir).replace(/\\/g, '/');
  fs.mkdirSync(aliasDir, { recursive: true });
  fs.writeFileSync(path.join(aliasDir, 'package.json'), JSON.stringify({ name: `@prisma/client-${prismaHash}`, version: '1.0.0', main: 'index.js' }, null, 2));
  fs.writeFileSync(path.join(aliasDir, 'index.js'), `module.exports = require('${relPath}');\n`);
  console.log(`✅ Created alias: node_modules/@prisma/client-${prismaHash}`);
}

if (sqliteHash) {
  console.log(`   Found SQLite hash: better-sqlite3-${sqliteHash}`);
  const aliasDir = path.join(rootDir, 'node_modules', `better-sqlite3-${sqliteHash}`);
  const actualDir = path.join(rootDir, 'node_modules', 'better-sqlite3');
  const relPath = path.relative(aliasDir, actualDir).replace(/\\/g, '/');
  fs.mkdirSync(aliasDir, { recursive: true });
  fs.writeFileSync(path.join(aliasDir, 'package.json'), JSON.stringify({ name: `better-sqlite3-${sqliteHash}`, version: '1.0.0', main: 'index.js' }, null, 2));
  fs.writeFileSync(path.join(aliasDir, 'index.js'), `module.exports = require('${relPath}');\n`);
  console.log(`✅ Created alias: node_modules/better-sqlite3-${sqliteHash}`);
  
  // Dynamically update package.json build files to include this exact directory
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (!pkg.build.files) pkg.build.files = [];
  
  // Remove any old sqlite hash entries
  pkg.build.files = pkg.build.files.filter(f => 
    !(typeof f === 'object' && f.from && f.from.startsWith('node_modules/better-sqlite3-')) &&
    !(typeof f === 'object' && f.from === 'node_modules/better-sqlite3*/')
  );
  
  // Add the exact new one
  pkg.build.files.push({
    from: `node_modules/better-sqlite3-${sqliteHash}/`,
    to: `node_modules/better-sqlite3-${sqliteHash}/`
  });
  
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated package.json build.files with exact better-sqlite3-${sqliteHash} path`);
}

if (!prismaHash && !sqliteHash) {
  console.log('✅ No hashes found — nothing to patch.');
}

console.log('🏗️ Generating blank template database for production...');
try {
  const templateDbPath = path.join(rootDir, 'prisma', 'template.db');
  if (fs.existsSync(templateDbPath)) fs.unlinkSync(templateDbPath);
  execSync('npx prisma db push', {
    cwd: rootDir,
    env: { ...process.env, DATABASE_URL: 'file:./prisma/template.db' },
    stdio: 'inherit'
  });
  console.log('✅ Template database generated at prisma/template.db');
} catch (err) {
  console.error('❌ Failed to generate template database:', err);
  process.exit(1);
}

