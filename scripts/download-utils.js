/**
 * Download utilities for video analysis service
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Check if URL is from a platform that needs yt-dlp
 */
function needsYtDlp(url) {
  return url.includes('youtube.com') || 
         url.includes('youtu.be') || 
         url.includes('twitch.tv') || 
         url.includes('tiktok.com');
}

/**
 * Download file from URL to temporary location
 * Uses yt-dlp for platform URLs, direct HTTP for others
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filename = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`;
    const filepath = path.join(tempDir, filename);
    
    // Use yt-dlp for platform URLs
    if (needsYtDlp(url)) {
      console.log(`Downloading from platform using yt-dlp: ${url}`);
      try {
        // Use yt-dlp to download best video format
        execSync(`yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${filepath}" "${url}"`, {
          stdio: 'inherit',
          maxBuffer: 100 * 1024 * 1024 // 100MB buffer
        });
        
        if (fs.existsSync(filepath)) {
          resolve(filepath);
        } else {
          reject(new Error('yt-dlp download failed - file not created'));
        }
      } catch (error) {
        reject(new Error(`yt-dlp download failed: ${error.message}`));
      }
    } else {
      // Direct HTTP download for direct video URLs
      console.log(`Downloading via HTTP: ${url}`);
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
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        reject(err);
      });
    }
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

