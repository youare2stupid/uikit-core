#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const KIT_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const config = JSON.parse(readFileSync(join(KIT_ROOT, 'uikit.json'), 'utf8'));
const vendor = resolve(KIT_ROOT, config.path);
const outDir = resolve(KIT_ROOT, config.outDir || 'dist');
const name = config.name || JSON.parse(readFileSync(join(KIT_ROOT, 'package.json'), 'utf8')).name;

function sassBin() {
  const local = join(KIT_ROOT, 'node_modules', '.bin', 'sass');
  if (existsSync(local)) return local;
  try {
    execFileSync('sh', ['-c', 'command -v sass'], { stdio: 'ignore' });
    return 'sass';
  } catch (error) {
    throw new Error('sass is not available: install it in the kit or put it on PATH');
  }
}

if (!existsSync(vendor)) {
  throw new Error('vendor is missing: run node scripts/uikit-sync.mjs first');
}

mkdirSync(outDir, { recursive: true });

const entry = config.entry || 'src/scss/uikit.scss';
const cssOut = join(outDir, name + '.uikit.css');
const jsOut = join(outDir, name + '.uikit.js');
const bundle = join(vendor, 'dist', config.bundle || 'uikit.iife.js');

const version = existsSync(join(vendor, '.uikit-manifest.json'))
  ? JSON.parse(readFileSync(join(vendor, '.uikit-manifest.json'), 'utf8')).version
  : 'unknown';

function withBanner(file, banner) {
  const text = readFileSync(file, 'utf8');
  const charset = text.match(/^@charset[^;]+;\s*/);
  writeFileSync(file, charset ? charset[0] + banner + text.slice(charset[0].length) : banner + text);
}

execFileSync(sassBin(), ['--no-source-map', '--load-path', vendor, entry, cssOut], { stdio: 'inherit' });
withBanner(cssOut, '/*! ' + name + '.uikit.css | styling for uikit-core ' + version + ' (MIT) | behaviour comes from uikit-core */\n');
cpSync(bundle, jsOut);

writeFileSync(
  join(outDir, 'uikit-build.json'),
  JSON.stringify({ name, uikit: version, css: cssOut.replace(KIT_ROOT + '/', ''), js: jsOut.replace(KIT_ROOT + '/', '') }, null, 2) + '\n'
);

console.log(cssOut.replace(KIT_ROOT + '/', '') + ' and ' + jsOut.replace(KIT_ROOT + '/', '') + ' written from uikit-core ' + version);
