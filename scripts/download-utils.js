/**
 * Download utilities for video analysis service
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Download file from URL to temporary location
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filename = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
    const filepath = path.join(tempDir, filename);
    const file = fs.createWriteStream(filepath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

/**
 * Cleanup temporary file
 */
function cleanupFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
}

module.exports = { downloadFile, cleanupFile };

