import { TransactionImporter } from './TransactionAdapter.js';

export class CSVImporter extends TransactionImporter {
  parse(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('File content is empty');
    }

    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing headers');
    }

    // Split headers and remove surrounding quotes/spaces
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    
    // Check required columns
    const required = ['amount', 'type', 'category', 'date'];
    for (const col of required) {
      if (!headers.includes(col)) {
        throw new Error(`CSV is missing required column: ${col}`);
      }
    }
    
    const amountIdx = headers.indexOf('amount');
    const typeIdx = headers.indexOf('type');
    const categoryIdx = headers.indexOf('category');
    const dateIdx = headers.indexOf('date');
    const noteIdx = headers.indexOf('note');

    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Split row values, handling basic quoting
      const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
      if (row.length < required.length) {
        throw new Error(`Row ${i} is malformed or missing columns`);
      }
      
      const amount = parseFloat(row[amountIdx]);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Row ${i} has invalid numeric amount: ${row[amountIdx]}`);
      }
      
      const type = row[typeIdx].toLowerCase();
      if (type !== 'income' && type !== 'expense') {
        throw new Error(`Row ${i} has invalid type: "${row[typeIdx]}" (must be "income" or "expense")`);
      }
      
      const category = row[categoryIdx];
      if (!category) {
        throw new Error(`Row ${i} has an empty category.`);
      }
      
      const date = row[dateIdx];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Row ${i} has invalid date format: "${row[dateIdx]}" (must be YYYY-MM-DD)`);
      }
      
      const note = noteIdx !== -1 ? row[noteIdx] : '';

      result.push({ amount, type, category, date, note });
    }
    
    return result;
  }
}
export default CSVImporter;
