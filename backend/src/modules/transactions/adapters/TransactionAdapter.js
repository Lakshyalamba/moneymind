/**
 * Abstract class representing a Transaction Importer.
 * New import formats must extend this class.
 */
export class TransactionImporter {
  /**
   * Parses the file content string and returns normalized transaction objects.
   * Normalized transaction structure: { amount, type, category, date, note }
   * @param {string} content - The raw string contents of the uploaded file.
   * @returns {Array<Object>} Normalized transaction list.
   */
  parse(content) {
    throw new Error('Method parse() must be implemented.');
  }
}

/**
 * Abstract class representing a Transaction Exporter.
 * New export formats must extend this class.
 */
export class TransactionExporter {
  /**
   * Exports normalized transaction objects into the adapter's string format.
   * @param {Array<Object>} transactions - The transactions array.
   * @returns {string} The output string.
   */
  export(transactions) {
    throw new Error('Method export() must be implemented.');
  }
}
