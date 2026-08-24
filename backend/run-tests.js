import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const getTestFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getTestFiles(filePath));
    } else if (file.endsWith('.test.js')) {
      results.push(filePath);
    }
  });
  return results;
};

const testFiles = getTestFiles(path.resolve('src/tests'));
if (testFiles.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

// Convert absolute paths to relative paths for cleaner output
const relativeTestFiles = testFiles.map(f => path.relative(path.resolve('.'), f));

console.log(`Running ${relativeTestFiles.length} test files:`);
console.log(relativeTestFiles.map(f => `  - ${f}`).join('\n'));

try {
  execSync(`node --test ${relativeTestFiles.map(f => `"${f}"`).join(' ')}`, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
