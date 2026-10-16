#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

const KIT_ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');

function parseArgs(argv) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      flags._.push(token);
      continue;
    }
    const [key, inline] = token.slice(2).split('=');
    if (inline !== undefined) flags[key] = inline;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) flags[key] = argv[(i += 1)];
    else flags[key] = true;
  }
  return flags;
}

function readConfig() {
  const path = join(KIT_ROOT, 'uikit.json');
  if (!existsSync(path)) throw new Error('uikit.json is missing next to this script');
  const config = JSON.parse(readFileSync(path, 'utf8'));
  if (!config.path) throw new Error('uikit.json needs a "path"');
  if (!config.include || config.include.length === 0) config.include = ['LICENSE', 'scss', 'dist', 'runtime', 'components', 'components.json'];
  return config;
}

function run(command, args, options) {
  return execFileSync(command, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', ...options });
}

function fromGit(repo, version, destination) {
  const args = ['clone', '--depth', '1', '--single-branch'];
  if (version) args.push('--branch', version);
  args.push(repo, destination);
  try {
    run('git', args);
  } catch (error) {
    throw new Error(
      'could not clone ' + repo + (version ? ' at ' + version : '') + '\n' +
      'check the repo url in uikit.json, the tag name, and that git can reach the host\n' +
      (error.stderr || error.message)
    );
  }
}

async function fromTarball(repo, version, destination) {
  const match = repo.replace(/\.git$/, '').match(/github\.com[/:]([^/]+)\/([^/]+)$/);
  if (!match) throw new Error('--tarball needs a github.com repository url');
  const url = 'https://codeload.github.com/' + match[1] + '/' + match[2] + '/tar.gz/refs/tags/' + version;
  const response = await fetch(url, {
    headers: process.env.GITHUB_TOKEN ? { authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}
  });
  if (!response.ok) throw new Error('download failed: ' + response.status + ' ' + url);
  const archive = join(tmpdir(), 'uikit-' + Date.now() + '.tar.gz');
  writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  mkdirSync(destination, { recursive: true });
  run('tar', ['-xzf', archive, '-C', destination, '--strip-components=1']);
  rmSync(archive, { force: true });
}

function walk(root) {
  const files = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry === '.git' || entry === 'node_modules') continue;
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) visit(path);
      else files.push(path);
    }
  };
  visit(root);
  return files;
}

function hash(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function manifest(target, version, repo) {
  const files = walk(target).map((path) => ({ path: relative(target, path), sha256: hash(path) }));
  return { version, repo, files };
}

function usage() {
  console.log(
    [
      'node scripts/uikit-sync.mjs [options]',
      '',
      '  --version <tag>   tag to install (default: uikit.json version)',
      '  --repo <url>      repository url (default: uikit.json repo)',
      '  --from <dir>      install from a local checkout instead of the network',
      '  --tarball         download the tag tarball instead of git clone',
      '  --check           verify the installed vendor matches the pinned version',
      '  --list            print the components shipped by the installed version'
    ].join('\n')
  );
}

const flags = parseArgs(process.argv.slice(2));
if (flags.help) {
  usage();
  process.exit(0);
}

const config = readConfig();
const target = resolve(KIT_ROOT, config.path);
const version = flags.version || config.version;
const repo = flags.repo || config.repo;
const manifestPath = join(target, '.uikit-manifest.json');

if (flags.check) {
  if (!existsSync(manifestPath)) {
    console.error('no vendor manifest at ' + manifestPath + '; run the sync first');
    process.exit(1);
  }
  const installed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const problems = [];
  if (installed.version !== version) problems.push('version ' + installed.version + ' != pinned ' + version);
  for (const file of installed.files) {
    const path = join(target, file.path);
    if (!existsSync(path)) problems.push('missing ' + file.path);
    else if (hash(path) !== file.sha256) problems.push('modified ' + file.path);
  }
  if (problems.length) {
    problems.forEach((problem) => console.error('  ' + problem));
    process.exit(1);
  }
  console.log('vendor ' + version + ' is clean (' + installed.files.length + ' files)');
  process.exit(0);
}

if (!version && !flags.from) {
  console.error('no version pinned: pass --version or set version in uikit.json');
  process.exit(2);
}

const staging = mkdtempSync(join(tmpdir(), 'uikit-sync-'));

try {
  if (flags.from) {
    cpSync(resolve(flags.from), staging, { recursive: true, dereference: true });
  } else if (flags.tarball) {
    await fromTarball(repo, version, staging);
  } else {
    fromGit(repo, version, staging);
  }

  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  const copied = [];
  for (const entry of config.include) {
    const source = join(staging, entry);
    if (!existsSync(source)) continue;
    const destination = join(target, entry);
    cpSync(source, destination, { recursive: true });
    copied.push(entry);
  }

  const record = manifest(target, version || 'local', flags.from ? 'local:' + resolve(flags.from) : repo);
  writeFileSync(manifestPath, JSON.stringify(record, null, 2) + '\n');

  const inventoryPath = join(target, 'components.json');
  const components = existsSync(inventoryPath) ? Object.keys(JSON.parse(readFileSync(inventoryPath, 'utf8')).components) : [];

  console.log('installed ' + (version || 'local') + ' into ' + relative(KIT_ROOT, target));
  console.log('included: ' + copied.join(', '));
  console.log('components: ' + (components.length ? components.join(', ') : 'none'));

  if (flags.list) {
    console.log(JSON.stringify(record.files.map((file) => file.path), null, 2));
  }
} finally {
  rmSync(staging, { recursive: true, force: true });
}
