import { TransactionImporter } from './TransactionAdapter.js';

export class JSONImporter extends TransactionImporter {
  parse(content) {
    if (!content || content.trim().length === 0) {
      throw new Error('File content is empty');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new Error(`Invalid JSON syntax: ${err.message}`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Root element of JSON transaction import must be an array of transaction objects');
    }

    const required = ['amount', 'type', 'category', 'date'];
    const result = [];

    parsed.forEach((item, i) => {
      // Check required fields
      for (const col of required) {
        if (item[col] === undefined || item[col] === null) {
          throw new Error(`Row ${i} is missing required field: ${col}`);
        }
      }

      const amount = parseFloat(item.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error(`Row ${i} has invalid numeric amount: ${item.amount}`);
      }

      const type = String(item.type).toLowerCase();
      if (type !== 'income' && type !== 'expense') {
        throw new Error(`Row ${i} has invalid type: "${item.type}" (must be "income" or "expense")`);
      }

      const category = String(item.category).trim();
      if (!category) {
        throw new Error(`Row ${i} has an empty category.`);
      }

      const date = String(item.date).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Row ${i} has invalid date format: "${item.date}" (must be YYYY-MM-DD)`);
      }

      const note = item.note ? String(item.note).trim() : '';

      result.push({ amount, type, category, date, note });
    });

    return result;
  }
}
export default JSONImporter;
