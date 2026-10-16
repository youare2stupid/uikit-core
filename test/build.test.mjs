import test from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('build produces esm and iife bundles', () => {
  execFileSync('node', ['tools/build.js'], { cwd: root, stdio: 'pipe' });
  const esm = join(root, 'dist/uikit.js');
  const iife = join(root, 'dist/uikit.iife.js');
  assert.ok(existsSync(esm) && existsSync(iife) && existsSync(join(root, 'dist/uikit.css')));

  const esmSource = readFileSync(esm, 'utf8');
  const iifeSource = readFileSync(iife, 'utf8');
  assert.ok(esmSource.length > 1000 && iifeSource.length > 1000);
  assert.ok(esmSource.startsWith('/*! uikit-core'));
  assert.ok(iifeSource.includes('window.UIKit'));
  assert.ok(esmSource.includes('defineAll'));
  assert.ok(iifeSource.includes('UIKitConfig'));
});

test('demo page lists every component from the inventory', () => {
  execFileSync('node', ['tools/build-demo.js'], { cwd: root, stdio: 'pipe' });
  const inventory = JSON.parse(readFileSync(join(root, 'components.json'), 'utf8'));
  const html = readFileSync(join(root, 'demo/index.html'), 'utf8');
  for (const name of Object.keys(inventory.components)) {
    assert.ok(html.includes('id="' + name + '"'), 'demo page misses ' + name);
  }
  assert.ok(html.includes('../dist/uikit.iife.js'));
});
