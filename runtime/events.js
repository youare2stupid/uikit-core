import { eventName } from './config.js';
import { on } from './dom.js';

export function emit(target, name, detail) {
  return target.dispatchEvent(
    new CustomEvent(eventName(name), { bubbles: true, composed: true, detail: detail || {} })
  );
}

export function listen(target, name, handler, options) {
  return on(target, eventName(name), handler, options);
}
