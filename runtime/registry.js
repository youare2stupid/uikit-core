import { tag } from './config.js';

const registry = new Map();

export function define(name, elementClass) {
  registry.set(name, elementClass);
  return elementClass;
}

export function registered() {
  return Array.from(registry.keys());
}

export function defineAll() {
  const defined = [];
  registry.forEach(function (elementClass, name) {
    const elementTag = tag(name);
    if (typeof customElements !== 'undefined' && !customElements.get(elementTag)) {
      customElements.define(elementTag, elementClass);
      defined.push(elementTag);
    }
  });
  return defined;
}
