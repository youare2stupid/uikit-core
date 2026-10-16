export function qs(selector, root) {
  return (root || document).querySelector(selector);
}

export function qsa(selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}

export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return function off() {
    target.removeEventListener(type, handler, options);
  };
}

export function off(target, type, handler, options) {
  target.removeEventListener(type, handler, options);
}

export function delegate(root, selector, type, handler) {
  return on(root, type, function (event) {
    const match = event.target.closest ? event.target.closest(selector) : null;
    if (match && root.contains(match)) handler.call(match, event, match);
  });
}

export function uid(prefix) {
  uid.counter = (uid.counter || 0) + 1;
  return (prefix || 'ui') + '-' + uid.counter;
}

export function setHidden(element, hidden) {
  if (hidden) element.setAttribute('hidden', '');
  else element.removeAttribute('hidden');
}

export function toggleClass(element, name, active) {
  if (active) element.classList.add(name);
  else element.classList.remove(name);
}

export function moveChildren(from, to, skip) {
  Array.prototype.slice.call(from.childNodes).forEach(function (node) {
    if (skip && skip(node)) return;
    to.appendChild(node);
  });
}
