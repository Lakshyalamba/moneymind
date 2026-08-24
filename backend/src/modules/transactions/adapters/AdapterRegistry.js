import CSVImporter from './CSVImporter.js';
import JSONImporter from './JSONImporter.js';
import CSVExporter from './CSVExporter.js';
import JSONExporter from './JSONExporter.js';

export class AdapterRegistry {
  constructor() {
    this.importers = new Map();
    this.exporters = new Map();

    // Register built-in importers
    this.registerImporter('csv', new CSVImporter());
    this.registerImporter('json', new JSONImporter());

    // Register built-in exporters
    this.registerExporter('csv', new CSVExporter());
    this.registerExporter('json', new JSONExporter());
  }

  registerImporter(format, importerInstance) {
    this.importers.set(format.toLowerCase().trim(), importerInstance);
  }

  registerExporter(format, exporterInstance) {
    this.exporters.set(format.toLowerCase().trim(), exporterInstance);
  }

  getImporter(format) {
    return this.importers.get(format.toLowerCase().trim());
  }

  getExporter(format) {
    return this.exporters.get(format.toLowerCase().trim());
  }
}

export const adapterRegistry = new AdapterRegistry();
export default adapterRegistry;
