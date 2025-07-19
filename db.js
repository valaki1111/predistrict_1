const fs = require('fs');
const path = require('path');

function readJSON(filename) {
  try {
    const data = fs.readFileSync(path.join(__dirname, filename), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeJSON(filename, data) {
  try {
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

module.exports = { readJSON, writeJSON };
