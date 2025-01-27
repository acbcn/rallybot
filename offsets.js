// offsets.js
const fs = require('fs');
const path = require('path');

// Where we store the JSON data
const filePath = path.join(__dirname, 'offsets.json');

// Our in-memory offsets object
// Structure example: offsets[alliance][userId] = numberOfSeconds
let offsets = {};

// Attempt to load existing data at startup
try {
  const data = fs.readFileSync(filePath, 'utf8');
  offsets = JSON.parse(data);
  console.log('Loaded offsets from offsets.json');
} catch (error) {
  console.log('No existing offsets.json found. Starting with empty data.');
}

// Function to write the current offsets to disk
function saveOffsets() {
  fs.writeFileSync(filePath, JSON.stringify(offsets, null, 2));
  console.log('Offsets saved to offsets.json');
}

module.exports = {
  offsets,
  saveOffsets
};
