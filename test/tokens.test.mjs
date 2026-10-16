import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function scssFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...scssFiles(path));
    else if (entry.name.endsWith('.scss')) out.push(path);
  }
  return out;
}

test('every --ui-* token used by a component is declared', () => {
  const files = [...scssFiles(join(root, 'scss')), ...scssFiles(join(root, 'components'))];
  const declared = new Set();
  const used = new Map();

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/(--ui-[a-z0-9-]+)\s*:/g)) declared.add(match[1]);
    for (const match of text.matchAll(/var\((--ui-[a-z0-9-]+)/g)) {
      if (!used.has(match[1])) used.set(match[1], file.replace(root + '/', ''));
    }
  }

  const missing = [...used.entries()].filter(([token]) => !declared.has(token));
  assert.deepStrictEqual(
    missing,
    [],
    'tokens used but never declared: ' + missing.map(([token, file]) => token + ' (' + file + ')').join(', ')
  );
});

test('structure css never hardcodes a colour outside the base defaults', () => {
  const files = scssFiles(join(root, 'components'));
  const offenders = [];
  for (const file of files) {
    const stripped = readFileSync(file, 'utf8').replace(/var\(\s*--ui-[a-z0-9-]+\s*,[^)]*\)/gi, 'var(--ui-token)');
    for (const match of stripped.matchAll(/#[0-9a-f]{3,8}\b/gi)) offenders.push(file.replace(root + '/', '') + ' ' + match[0]);
  }
  assert.deepStrictEqual(offenders, [], 'component structure files must not hardcode colours outside a var() fallback: ' + offenders.join(', '));
});
