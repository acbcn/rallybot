const fs = require('fs');
const path = require('path');

// Where we store the JSON data
const filePath = path.join(__dirname, 'offsets.json');

// Our in-memory offsets object
let offsets = {};

// Attempt to load existing data at startup
try {
  let data = fs.readFileSync(filePath, 'utf8');
  // Remove BOM if present
  if (data.charCodeAt(0) === 0xFEFF) {
    data = data.slice(1);
  }
  offsets = JSON.parse(data);
  console.log('Loaded offsets from offsets.json');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('No existing offsets.json found. Starting with empty data.');
    // Create empty offsets file
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  } else {
    console.log('Error reading offsets.json. Starting with empty data.');
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
  }
}

module.exports = {
  offsets,
  saveOffsets
};