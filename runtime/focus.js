export const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export function focusables(root) {
  if (!root) return [];
  return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function (element) {
    return element.offsetParent !== null || element === document.activeElement;
  });
}

export function focusFirst(root) {
  const first = focusables(root)[0];
  if (!first) {
    if (root && root.focus) root.focus({ preventScroll: true });
    return null;
  }
  focusElement(first);
  return first;
}

export function focusElement(element) {
  if (!element || !element.focus) return;
  try {
    element.focus({ preventScroll: true });
  } catch (error) {
    element.focus();
  }
}

export function rememberFocus() {
  return typeof HTMLElement !== 'undefined' && document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}

export function restoreFocus(element) {
  if (element && element.isConnected) focusElement(element);
}

export function trapFocus(root, event) {
  if (event.key !== 'Tab') return;
  const items = focusables(root);
  if (items.length === 0) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    focusElement(last);
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    focusElement(first);
  }
}
