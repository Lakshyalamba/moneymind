# MoneyMind Extensibility Guide

MoneyMind is built around pluggable adapter abstractions. You can write custom AI providers, transaction categorization rules, and import/export adapters without modifying core logic.

---

## 1. Adding a Custom AI Provider

### Steps:
1. Create a file under `backend/src/modules/ai/providers/` (e.g. `OpenAIProvider.js`).
2. Extend `AIProvider` base class and implement the required methods:
   ```javascript
   import AIProvider from './AIProvider.js';

   export class OpenAIProvider extends AIProvider {
     async generateResponse(prompt, systemInstruction) {
       // Perform API request using openai npm SDK or fetch
     }
     // Implement categorizeTransaction, analyzeSpending, generateInsights...
   }
   ```
3. Register the new builder function in `backend/src/modules/ai/providers/ProviderFactory.js`:
   ```javascript
   this.register('openai', (key) => new OpenAIProvider(key));
   ```
4. Set the env variables:
   ```env
   AI_PROVIDER="openai"
   AI_API_KEY="your-openai-api-key"
   ```

---

## 2. Adding a Transaction Categorizer

You can add dynamic classification strategies to the categorization engine pipeline:

1. Create your categorizer inside `backend/src/modules/transactions/categorization/` (e.g. `MLCategorizer.js`):
   ```javascript
   export class MLCategorizer {
     constructor() {
       this.name = 'ml-categorizer';
     }
     async categorize(userId, note, allowedCategories) {
       // Return { category, confidence, strategy: this.name, reason } or null if no match
     }
   }
   ```
2. Register it inside `backend/src/modules/transactions/categorization/CategorizationEngine.js`:
   ```javascript
   import MLCategorizer from './MLCategorizer.js';
   this.register(new MLCategorizer());
   ```

---

## 3. Adding Community Merchant Rules

Adding merchant-to-category rules does not require any Javascript knowledge:

1. Open `rules/` and select the appropriate country subfolder (or use `global/`).
2. Append a new rule object to the JSON file:
   ```json
   {
     "pattern": "swiggy",
     "category": "Food & Dining"
   }
   ```
   *Note: Patterns must be lowercase and trimmed.*
3. Run the CLI validator locally to ensure formatting correctness and avoid duplicate pattern conflicts:
   ```bash
   npm run validate:merchant-rules
   ```

---

## 4. Adding an Importer or Exporter

You can register custom converters for CSV, JSON, Excel, etc.

1. **Write an Importer**:
   Create a class under `backend/src/modules/transactions/adapters/` extending `TransactionImporter`:
   ```javascript
   import { TransactionImporter } from './TransactionAdapter.js';

   export class ExcelImporter extends TransactionImporter {
     parse(content) {
       // Parse content and return array of: { amount, type, category, date, note }
     }
   }
   ```
2. **Write an Exporter**:
   Create a class extending `TransactionExporter`:
   ```javascript
   import { TransactionExporter } from './TransactionAdapter.js';

   export class ExcelExporter extends TransactionExporter {
     export(transactions) {
       // Return formatted excel binary / string content
     }
   }
   ```
3. **Register inside `backend/src/modules/transactions/adapters/AdapterRegistry.js`**:
   ```javascript
   this.registerImporter('excel', new ExcelImporter());
   this.registerExporter('excel', new ExcelExporter());
   ```
