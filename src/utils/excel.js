'use strict';

const XLSX = require('xlsx');

/**
 * Baca file Excel/CSV → array of objects
 * @param {string} filePath
 * @returns {Array}
 */
function readExcel(filePath) {
  const wb    = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/**
 * Buat buffer Excel dari array data
 * @param {Array} data        - array of objects
 * @param {string} sheetName
 * @returns {Buffer}
 */
function writeExcel(data, sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Buat buffer Excel dengan multiple sheets
 * @param {Array<{name:string, data:Array}>} sheets
 * @returns {Buffer}
 */
function writeExcelMultiSheet(sheets) {
  const wb = XLSX.utils.book_new();
  for (const { name, data } of sheets) {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = { readExcel, writeExcel, writeExcelMultiSheet };
