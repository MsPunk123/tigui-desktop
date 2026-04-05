import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const allowedLiteralFiles = new Set([path.join(srcDir, 'index.css')]);
const fileExtensions = new Set(['.css', '.ts', '.tsx']);
const colorLiteralPattern = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi;

const violations = [];

function walk(directoryPath) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
      continue;
    }

    if (!fileExtensions.has(path.extname(entryPath)) || entryPath.endsWith('.d.ts')) {
      continue;
    }

    if (allowedLiteralFiles.has(entryPath)) {
      continue;
    }

    const source = fs.readFileSync(entryPath, 'utf8');
    const lines = source.split(/\r?\n/);

    lines.forEach((line, index) => {
      colorLiteralPattern.lastIndex = 0;
      if (!colorLiteralPattern.test(line)) {
        return;
      }

      violations.push(`${path.relative(rootDir, entryPath)}:${index + 1} -> ${line.trim()}`);
    });
  }
}

walk(srcDir);

if (violations.length > 0) {
  console.error('Design token guardrail failed. Use semantic tokens instead of raw color literals.');
  console.error('Allowed file(s): src/index.css');
  console.error('');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Design token guardrail passed.');
