import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GLOBAL_CATEGORIES = [
  'Food & Dining', 'Salary', 'Housing', 'Utilities', 
  'Transportation', 'Entertainment', 'Shopping', 'Healthcare', 'Freelance', 'Other'
];

const rulesDir = path.resolve(__dirname, '../../rules');

function validateRules() {
  console.log('Starting validation of merchant rules...');
  let errors = [];
  let totalRules = 0;
  let seenPatterns = new Set();

  if (!fs.existsSync(rulesDir)) {
    console.error(`Rules directory not found: ${rulesDir}`);
    process.exit(1);
  }

  const subdirs = ['global', 'india', 'usa', 'uk'];

  subdirs.forEach(subdir => {
    const dirPath = path.join(rulesDir, subdir);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Warning: Subdirectory ${subdir} not found under rules/. Skipping.`);
      return;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const relativePath = path.relative(path.resolve(__dirname, '../..'), filePath);
      console.log(`Validating ${relativePath}...`);

      let content;
      try {
        content = fs.readFileSync(filePath, 'utf8');
      } catch (err) {
        errors.push(`[${relativePath}] Failed to read file: ${err.message}`);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        errors.push(`[${relativePath}] Malformed JSON structure: ${err.message}`);
        return;
      }

      if (!Array.isArray(parsed)) {
        errors.push(`[${relativePath}] Root element must be an array of rule objects.`);
        return;
      }

      parsed.forEach((rule, idx) => {
        totalRules++;
        if (!rule.pattern || typeof rule.pattern !== 'string') {
          errors.push(`[${relativePath}] Rule #${idx} is missing a string "pattern".`);
          return;
        }

        const cleanPattern = rule.pattern.trim().toLowerCase();
        if (cleanPattern !== rule.pattern) {
          errors.push(`[${relativePath}] Rule pattern "${rule.pattern}" must be lowercase and trimmed.`);
        }

        if (seenPatterns.has(cleanPattern)) {
          errors.push(`[${relativePath}] Duplicate pattern found: "${cleanPattern}"`);
        } else {
          seenPatterns.add(cleanPattern);
        }

        if (!rule.category || typeof rule.category !== 'string') {
          errors.push(`[${relativePath}] Rule pattern "${rule.pattern}" is missing a string "category".`);
          return;
        }

        if (!GLOBAL_CATEGORIES.includes(rule.category)) {
          errors.push(`[${relativePath}] Rule pattern "${rule.pattern}" uses invalid/unsupported category: "${rule.category}". Expected one of: ${GLOBAL_CATEGORIES.join(', ')}`);
        }
      });
    });
  });

  if (errors.length > 0) {
    console.error(`\n❌ Validation Failed! Found ${errors.length} error(s):`);
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log(`\n✅ Validation Passed! Successfully validated ${totalRules} rules in ${seenPatterns.size} merchant mappings.`);
}

validateRules();
