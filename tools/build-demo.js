import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const inventory = JSON.parse(readFileSync(join(root, 'components.json'), 'utf8'));
const template = readFileSync(join(root, 'demo/template.html'), 'utf8');

const blocks = Object.keys(inventory.components).map((name) => {
  const meta = inventory.components[name];
  const markup = readFileSync(join(root, meta.demo), 'utf8');
  const tokens = meta.tokens.length ? meta.tokens.join(', ') : 'none';
  const events = meta.events.length ? meta.events.map((event) => 'ui:' + event).join(', ') : 'none';
  return [
    '<section class="demo-block" id="' + name + '">',
    '  <header class="demo-head">',
    '    <h2>' + name + '</h2>',
    '    <p class="demo-meta">events: ' + events + '</p>',
    '    <p class="demo-meta">tokens: ' + tokens + '</p>',
    '  </header>',
    '  <div class="demo-body">',
    markup.trim(),
    '  </div>',
    '</section>'
  ].join('\n');
});

const nav = Object.keys(inventory.components)
  .map((name) => '<a href="#' + name + '">' + name + '</a>')
  .join('');

const html = template
  .replace('<!-- nav -->', () => nav)
  .replace('<!-- components -->', () => blocks.join('\n\n'));

writeFileSync(join(root, 'demo/index.html'), html);
console.log('demo/index.html written with ' + Object.keys(inventory.components).length + ' component(s)');
