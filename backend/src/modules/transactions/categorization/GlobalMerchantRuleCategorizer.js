import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class GlobalMerchantRuleCategorizer {
  constructor() {
    this.name = 'merchant-rule';
    this.rules = [];
    this.loadRules();
  }

  loadRules() {
    try {
      // Find rules directory relative to this file location (src/modules/transactions/categorization/)
      const rulesDir = path.resolve(__dirname, '../../../../../rules');
      if (!fs.existsSync(rulesDir)) {
        console.warn(`[merchant-rules]: Rules directory not found at ${rulesDir}`);
        return;
      }

      const subdirs = ['global', 'india', 'usa', 'uk'];
      subdirs.forEach(subdir => {
        const dirPath = path.join(rulesDir, subdir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
          files.forEach(file => {
            try {
              const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed)) {
                this.rules.push(...parsed);
              }
            } catch (err) {
              console.error(`[merchant-rules]: Error parsing rules in ${subdir}/${file}:`, err.message);
            }
          });
        }
      });

      console.log(`[merchant-rules]: Successfully loaded ${this.rules.length} merchant pattern rules.`);
    } catch (error) {
      console.error('[merchant-rules]: Failed to load merchant rules:', error.message);
    }
  }

  async categorize(userId, note, allowedCategories) {
    if (!note) return null;
    const cleanNote = note.toLowerCase();

    for (const rule of this.rules) {
      if (cleanNote.includes(rule.pattern.toLowerCase())) {
        if (allowedCategories.includes(rule.category)) {
          return {
            category: rule.category,
            confidence: 'high',
            strategy: this.name,
            reason: `Matched global merchant pattern "${rule.pattern}"`
          };
        }
      }
    }

    return null;
  }
}
export default GlobalMerchantRuleCategorizer;
