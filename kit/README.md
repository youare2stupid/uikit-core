# Starter kit

Copy this folder to start a kit on top of [uikit-core](../).
The core owns behaviour, accessibility and the markup contract; a kit only owns the look.

## Files

| File | What it is |
| --- | --- |
| `uikit.json` | where the core comes from, and how the kit is built |
| `scripts/uikit-sync.mjs` | vendors the pinned core release into `vendor/uikit-core` |
| `scripts/build-uikit.mjs` | compiles the skin into `dist/<name>.uikit.css` and copies the core runtime |
| `src/scss/uikit.scss` | the skin: map your tokens onto `--ui-*`, then style the component roles |
| `demo/uikit.html`, `demo/kit-demo.css` | a page to check the result |

## Steps

1. Copy the folder into your kit repository.
2. In `uikit.json` set `name`, point `repo` at your core repository and set `version` to the tag you want.
3. Add a `package.json` with `sass` as a dev dependency, then run:

```bash
npm install
node scripts/uikit-sync.mjs
node scripts/build-uikit.mjs
```

4. Write the skin in `src/scss/uikit.scss` and open `demo/uikit.html` in a browser.

`uikit.json` is the single place to change: `path` is where the core is vendored, `include` lists what
is copied, `entry` is the skin entry file, `outDir` is where the build writes.

## Rules that keep kits interchangeable

- Style through `--ui-*` custom properties. The core ships no colours, radii or shadows of its own.
- Scope every rule with the component tag: `ui-tabs [data-ui-role='tab']`, never a bare `[data-ui-role]`.
- Do not fork behaviour. Everything interactive, focusable and animatable already lives in the core.
- Read the per-component contract before styling: `vendor/uikit-core/components/<name>/contract.json`.

## Commands

| Command | What it does |
| --- | --- |
| `node scripts/uikit-sync.mjs` | install or refresh the vendored core |
| `node scripts/uikit-sync.mjs --check` | verify the vendor against its manifest |
| `node scripts/uikit-sync.mjs --tarball` | download the tag archive instead of cloning |
| `node scripts/uikit-sync.mjs --list` | print the vendored file list |
| `node scripts/build-uikit.mjs` | compile the CSS and copy the runtime into `dist/` |
