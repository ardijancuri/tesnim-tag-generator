// Script to download Inter font files
// Run this with: node download-fonts.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.join(__dirname, 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Inter font files - using Google Fonts CDN
const fontFiles = [
  {
    name: 'Inter-Regular.ttf',
    url: 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf'
  },
  {
    name: 'Inter-Bold.ttf',
    url: 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf'
  }
];

// Alternative: If GitHub URLs don't work, you can manually download from:
// https://fonts.google.com/specimen/Inter
// Or use: https://github.com/rsms/inter/releases

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      reject(err);
    });
  });
}

async function downloadFonts() {
  console.log('Downloading Inter font files...');
  
  for (const font of fontFiles) {
    const filepath = path.join(fontsDir, font.name);
    
    // Skip if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`Skipping ${font.name} (already exists)`);
      continue;
    }
    
    try {
      await downloadFile(font.url, filepath);
    } catch (error) {
      console.error(`Error downloading ${font.name}:`, error.message);
      console.log(`\nPlease download Inter font manually from: https://github.com/rsms/inter`);
      console.log(`Place Inter-Regular.ttf and Inter-Bold.ttf in the ${fontsDir} directory`);
    }
  }
  
  console.log('\nFont download complete!');
}

downloadFonts();

