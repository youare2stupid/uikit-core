const DEFAULTS = {
  tagPrefix: 'ui',
  eventNs: 'ui',
  attributes: {
    role: 'data-ui-role',
    target: 'data-ui-target',
    open: 'data-ui-open',
    close: 'data-ui-close'
  },
  theme: { attribute: 'data-theme', storageKey: 'ui-theme', followSystem: true },
  motion: { attribute: 'data-ui-motion', storageKey: 'ui-motion' }
};

export const config = JSON.parse(JSON.stringify(DEFAULTS));

export function configure(patch) {
  if (!patch) return config;
  for (const key of ['tagPrefix', 'eventNs', 'attributes', 'theme', 'motion']) {
    if (patch[key] === undefined) continue;
    if (typeof patch[key] === 'object') Object.assign(config[key], patch[key]);
    else config[key] = patch[key];
  }
  return config;
}

export function tag(name) {
  return config.tagPrefix + '-' + name;
}

export function eventName(name) {
  return config.eventNs + ':' + name;
}

export function attr(name) {
  return config.attributes[name];
}

export function roleSelector(role) {
  return '[' + config.attributes.role + '="' + role + '"]';
}

export function findRole(root, role) {
  return root ? root.querySelector(roleSelector(role)) : null;
}

export function findRoles(root, role) {
  return root ? Array.prototype.slice.call(root.querySelectorAll(roleSelector(role))) : [];
}

export const defaults = DEFAULTS;
