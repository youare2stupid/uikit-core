import { build } from 'esbuild';
import * as sass from 'sass';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const banner = [
  '/*! ' + pkg.name + ' v' + pkg.version,
  'License: ' + pkg.license + '. */',
  ''
].join('\n');

mkdirSync(join(root, 'dist'), { recursive: true });

const shared = {
  entryPoints: [join(root, 'runtime/index.js')],
  bundle: true,
  legalComments: 'none',
  banner: { js: banner },
  target: 'es2019',
  logLevel: 'warning'
};

await build({ ...shared, format: 'esm', outfile: join(root, 'dist/uikit.js') });
await build({ ...shared, entryPoints: [join(root, 'runtime/iife.js')], format: 'iife', outfile: join(root, 'dist/uikit.iife.js') });

const css = sass.compile(join(root, 'scss/index.scss'), { style: 'compressed' });
writeFileSync(join(root, 'dist/uikit.css'), css.css);

const sizes = ['dist/uikit.js', 'dist/uikit.iife.js', 'dist/uikit.css'].map((file) => {
  const bytes = readFileSync(join(root, file)).length;
  return file + ' ' + bytes + ' B';
});

const buildInfo = { name: pkg.name, version: pkg.version, files: sizes };
writeFileSync(join(root, 'dist/build.json'), JSON.stringify(buildInfo, null, 2) + '\n');
console.log(sizes.join('\n'));
