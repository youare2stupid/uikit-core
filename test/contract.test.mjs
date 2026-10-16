import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirs = readdirSync(join(root, 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const read = (...parts) => readFileSync(join(root, ...parts), 'utf8');
const contractOf = (name) => JSON.parse(read('components', name, 'contract.json'));

function sourcesFor(name) {
  const own = ['logic.js', 'structure.scss', 'demo.html'].map((file) => read('components', name, file));
  const logic = own[0];
  const shared = [];
  if (logic.includes('overlay-element.js') || logic.includes('runtime/overlay.js')) {
    shared.push(read('components', 'overlay-element.js'), read('runtime', 'overlay.js'));
  }
  return { own: own.join('\n'), all: own.concat(shared).join('\n') };
}

function rolesUsed(text) {
  const used = new Set();
  for (const match of text.matchAll(/data-ui-role\s*=\s*["']([\w-]+)["']/g)) used.add(match[1]);
  for (const match of text.matchAll(/findRoles?\([^,]+,\s*['"]([\w-]+)['"]\)/g)) used.add(match[1]);
  for (const match of text.matchAll(/attr\(\s*['"]role['"]\s*\)\s*,\s*['"]([\w-]+)['"]/g)) used.add(match[1]);
  return used;
}

function eventsEmitted(text) {
  return new Set([...text.matchAll(/emit\([^,]+,\s*['"]([\w-]+)['"]/g)].map((match) => match[1]));
}

test('every declared role is used by the component and every used role is declared', () => {
  const offenders = [];
  for (const name of dirs) {
    const contract = contractOf(name);
    const used = rolesUsed(sourcesFor(name).all);
    for (const role of contract.roles) {
      if (!used.has(role)) offenders.push(name + ': role "' + role + '" is declared but never used');
    }
    for (const role of used) {
      if (!contract.roles.includes(role)) offenders.push(name + ': role "' + role + '" is used but not declared');
    }
  }
  assert.deepStrictEqual(offenders, [], offenders.join(' | '));
});

test('every declared method exists in the component source', () => {
  const offenders = [];
  for (const name of dirs) {
    const contract = contractOf(name);
    const source = sourcesFor(name).all;
    for (const method of contract.methods || []) {
      const bare = String(method).split('(')[0].trim();
      if (!bare) continue;
      const defined = new RegExp('(^|[\\s{;])(get\\s+)?' + bare + '\\s*[(=]').test(source);
      if (!defined) offenders.push(name + ': method "' + method + '" is not implemented');
    }
  }
  assert.deepStrictEqual(offenders, [], offenders.join(' | '));
});

test('every declared event is emitted and no undeclared event is emitted', () => {
  const offenders = [];
  for (const name of dirs) {
    const contract = contractOf(name);
    const emitted = eventsEmitted(sourcesFor(name).all);
    for (const event of contract.events || []) {
      if (!emitted.has(event)) offenders.push(name + ': event "' + event + '" is declared but never emitted');
    }
    for (const event of emitted) {
      if (!(contract.events || []).includes(event)) offenders.push(name + ': event "' + event + '" is emitted but not declared');
    }
  }
  assert.deepStrictEqual(offenders, [], offenders.join(' | '));
});

test('every declared attribute or state is referenced by the component source', () => {
  const offenders = [];
  for (const name of dirs) {
    const contract = contractOf(name);
    const runtime = readdirSync(join(root, 'runtime'))
      .filter((file) => file.endsWith('.js'))
      .map((file) => read('runtime', file))
      .join('\n');
    const source = sourcesFor(name).all + runtime;
    for (const attribute of (contract.attributes || [])) {
      if (!source.includes(attribute)) offenders.push(name + ': attribute "' + attribute + '" is never referenced');
    }
  }
  assert.deepStrictEqual(offenders, [], offenders.join(' | '));
});
