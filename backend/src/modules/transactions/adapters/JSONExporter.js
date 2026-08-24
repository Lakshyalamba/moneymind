import { TransactionExporter } from './TransactionAdapter.js';

export class JSONExporter extends TransactionExporter {
  export(transactions) {
    if (!transactions) return '[]';
    
    // Select and map normalized properties only
    const normalized = transactions.map(t => ({
      date: t.date,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.category,
      note: t.note || ''
    }));

    return JSON.stringify(normalized, null, 2);
  }
}
export default JSONExporter;
