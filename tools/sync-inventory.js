import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = join(root, 'components');

const names = readdirSync(componentsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const inventory = {};

for (const name of names) {
  const contractPath = join(componentsDir, name, 'contract.json');
  if (!existsSync(contractPath)) continue;
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  if (contract.name !== name) throw new Error('contract.json name mismatch in components/' + name);
  inventory[name] = {
    status: contract.status,
    since: contract.since,
    logic: 'components/' + name + '/logic.js',
    structure: 'components/' + name + '/structure.scss',
    demo: 'components/' + name + '/demo.html',
    roles: contract.roles || [],
    states: contract.attributes || [],
    events: contract.events || [],
    tokens: contract.tokens || []
  };
}

const payload = {
  name: 'uikit-core',
  components: inventory
};

writeFileSync(join(root, 'components.json'), JSON.stringify(payload, null, 2) + '\n');
console.log('components: ' + names.length + ' (' + names.join(', ') + ')');
