/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const _pngToIco = require('png-to-ico');
const pngToIco = _pngToIco.default || _pngToIco;

pngToIco('assets/icon.png')
  .then(buf => {
    if (!fs.existsSync('build')) {
      fs.mkdirSync('build', { recursive: true });
    }
    fs.writeFileSync('build/icon.ico', buf);
    console.log('✅ Generated build/icon.ico from assets/icon.png');
  })
  .catch(err => {
    console.error('Failed to generate icon.ico:', err);
    process.exit(1);
  });
