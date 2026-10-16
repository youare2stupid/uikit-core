import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(readFileSync(join(root, 'components.json'), 'utf8'));
const dirs = readdirSync(join(root, 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

test('inventory matches the component directories', () => {
  assert.deepStrictEqual(Object.keys(inventory.components).sort(), dirs);
});

test('every component ships logic, structure, contract and demo', () => {
  for (const name of dirs) {
    for (const file of ['logic.js', 'structure.scss', 'contract.json', 'demo.html']) {
      assert.ok(existsSync(join(root, 'components', name, file)), name + '/' + file + ' is missing');
    }
  }
});

test('contracts declare tag, roles, states and events', () => {
  for (const name of dirs) {
    const contract = JSON.parse(readFileSync(join(root, 'components', name, 'contract.json'), 'utf8'));
    assert.strictEqual(contract.name, name);
    assert.ok(contract.tag && contract.tag.startsWith('ui-'), name + ' tag must be ui-<name>');
    assert.ok(Array.isArray(contract.roles) && contract.roles.length > 0, name + ' needs roles');
    assert.ok(Array.isArray(contract.events), name + ' needs events');
    assert.ok(Array.isArray(contract.tokens) && contract.tokens.length > 0, name + ' needs tokens');
  }
});

test('structure scss is registered in the structure index', () => {
  const index = readFileSync(join(root, 'scss/structure/_index.scss'), 'utf8');
  for (const name of dirs) {
    assert.ok(index.includes(name), 'scss/structure/_index.scss must forward ' + name);
  }
});

test('components are imported by the library entry', () => {
  const entry = readFileSync(join(root, 'runtime/index.js'), 'utf8');
  for (const name of dirs) {
    assert.ok(entry.includes('components/' + name + '/logic.js'), name + ' is not imported in runtime/index.js');
  }
});

test('component structure selectors stay scoped to the component tag', () => {
  const offenders = [];
  for (const name of dirs) {
    const file = 'components/' + name + '/structure.scss';
    const text = readFileSync(join(root, file), 'utf8');
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line.endsWith('{')) continue;
      const selector = line.slice(0, -1).trim();
      if (selector === '' || selector.startsWith('@') || selector.startsWith('&')) continue;
      const parts = selector.split(',').map((part) => part.trim());
      for (const part of parts) {
        if (part.startsWith('from') || part.startsWith('to') || /^\d+%$/.test(part)) continue;
        if (!part.includes('ui-' + name)) offenders.push(file + ': ' + part);
      }
    }
  }
  assert.deepStrictEqual(offenders, [], 'structure selectors must be scoped by the component tag: ' + offenders.join(' | '));
});

test('component keyframes are namespaced', () => {
  const offenders = [];
  for (const name of dirs) {
    const text = readFileSync(join(root, 'components', name, 'structure.scss'), 'utf8');
    for (const match of text.matchAll(/@keyframes\s+([\w-]+)/g)) {
      if (match[1] !== 'ui-' + name + '-' + match[1].split('-').slice(2).join('-') && !match[1].startsWith('ui-' + name + '-')) {
        offenders.push(name + ' ' + match[1]);
      }
    }
  }
  assert.deepStrictEqual(offenders, [], 'keyframes must start with ui-<component>-: ' + offenders.join(', '));
});
