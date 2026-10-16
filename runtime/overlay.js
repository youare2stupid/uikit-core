import { attr } from './config.js';
import { emit } from './events.js';
import { on } from './dom.js';
import { focusFirst, rememberFocus, restoreFocus, trapFocus } from './focus.js';

const stack = [];
let bound = false;

function documentRoot() {
  return typeof document === 'undefined' ? null : document;
}

function lockScroll(locked) {
  const doc = documentRoot();
  if (!doc) return;
  doc.documentElement.style.overflow = locked ? 'hidden' : '';
}

function overlayHost(element) {
  return element && element.closest ? element.closest('[data-ui-overlay]') : null;
}

function resolveTarget(element) {
  const selector = element.getAttribute(attr('target'));
  return selector ? resolveSelector(selector) : overlayHost(element);
}

function resolveSelector(selector) {
  const doc = documentRoot();
  if (!doc) return null;

  try {
    const direct = doc.querySelector(selector);
    if (direct) return direct;
  } catch (error) {
    return null;
  }

  if (selector.charAt(0) === '#') {
    const byId = doc.getElementById(selector.slice(1));
    if (byId) return byId;
  }

  return doc.querySelector('[' + attr('target') + '="' + selector + '"]');
}

function onKeydown(event) {
  const current = stack[stack.length - 1];
  if (!current) return;
  if (event.key === 'Escape' && current.dismissible) {
    event.preventDefault();
    closeOverlay(current.element);
  } else if (event.key === 'Tab') {
    trapFocus(current.box, event);
  }
}

function onClick(event) {
  const target = event.target;
  if (!target || !target.closest) return;

  const closer = target.closest('[' + attr('close') + ']');
  if (closer) {
    const host = overlayHost(closer);
    if (host) {
      event.preventDefault();
      closeOverlay(host);
      return;
    }
  }

  const opener = target.closest('[' + attr('open') + ']');
  if (opener) {
    const host = resolveTarget(opener);
    if (host) {
      event.preventDefault();
      openOverlay(host, {});
    }
  }
}

function bindGlobal() {
  if (bound) return;
  const doc = documentRoot();
  if (!doc) return;
  bound = true;
  on(doc, 'keydown', onKeydown);
  on(doc, 'click', onClick);
}

export function isOverlayOpen(element) {
  return stack.some(function (entry) {
    return entry.element === element;
  });
}

export function openOverlay(element, options) {
  if (!element || isOverlayOpen(element)) return null;
  bindGlobal();
  const settings = options || {};
  const entry = {
    element,
    box: settings.box || element,
    dismissible: settings.dismissible !== false,
    lockScroll: settings.lockScroll !== false,
    restoreTo: rememberFocus()
  };
  stack.push(entry);
  element.setAttribute('open', '');
  element.setAttribute('data-state', 'open');
  if (entry.lockScroll) lockScroll(true);
  if (settings.focus !== false) focusFirst(entry.box);
  emit(element, 'open', { element });
  return entry;
}

export function closeOverlay(element, options) {
  const index = stack.findIndex(function (entry) {
    return entry.element === element;
  });
  if (index === -1) return false;
  const entry = stack.splice(index, 1)[0];
  const settings = options || {};
  element.removeAttribute('open');
  element.setAttribute('data-state', 'closed');
  if (stack.length === 0 && entry.lockScroll) lockScroll(false);
  if (settings.restoreFocus !== false) restoreFocus(entry.restoreTo);
  emit(element, 'close', { element });
  return true;
}

export function toggleOverlay(element, options) {
  if (isOverlayOpen(element)) return closeOverlay(element, options);
  return openOverlay(element, options);
}

export function closeTop() {
  const current = stack[stack.length - 1];
  return current ? closeOverlay(current.element) : false;
}

export function handleBackdrop(event, element) {
  if (!event.target || event.target === element) {
    closeOverlay(element);
    return true;
  }
  return false;
}

export function openStack() {
  return stack.slice();
}

bindGlobal();
