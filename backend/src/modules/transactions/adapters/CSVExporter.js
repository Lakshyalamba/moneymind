import { TransactionExporter } from './TransactionAdapter.js';

export class CSVExporter extends TransactionExporter {
  export(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'date,amount,type,category,note\n';
    }

    const headers = ['date', 'amount', 'type', 'category', 'note'];
    const rows = transactions.map(t => {
      // Escape commas and quotes in note/category fields
      const cleanNote = (t.note || '').replace(/"/g, '""');
      const cleanCategory = (t.category || '').replace(/"/g, '""');
      
      const formattedNote = cleanNote.includes(',') ? `"${cleanNote}"` : cleanNote;
      const formattedCategory = cleanCategory.includes(',') ? `"${cleanCategory}"` : cleanCategory;
      
      return `${t.date},${t.amount},${t.type},${formattedCategory},${formattedNote}`;
    });

    return [headers.join(','), ...rows].join('\n') + '\n';
  }
}
export default CSVExporter;
