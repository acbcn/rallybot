const fs = require('fs');
const path = require('path');

// Define data directory based on environment
const dataDir = process.env.NODE_ENV === 'production' ? '/data' : __dirname;

// Create data directory if it doesn't exist in production
if (process.env.NODE_ENV === 'production') {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Where we store the JSON data
const filePath = path.join(dataDir, 'offsets.json');

// Our in-memory offsets object
// Structure example: offsets[alliance][userId] = numberOfSeconds
let offsets = {};

// Attempt to load existing data at startup
try {
  const data = fs.readFileSync(filePath, 'utf8');
  offsets = JSON.parse(data);
  console.log('Loaded offsets from offsets.json');
} catch (error) {
  console.log('No existing offsets.json found or error reading file. Starting with empty data.');
  console.log('File path attempted:', filePath);
  if (error.code !== 'ENOENT') {
    console.error('Error details:', error);
  }
}

// Function to write the current offsets to disk
function saveOffsets() {
  try {
    fs.writeFileSync(filePath, JSON.stringify(offsets, null, 2));
    console.log('Offsets saved to offsets.json');
  } catch (error) {
    console.error('Error saving offsets:', error);
    console.error('Attempted to save to:', filePath);
  }
}

module.exports = {
  offsets,
  saveOffsets
};