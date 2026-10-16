import { config } from './config.js';
import { emit } from './events.js';

let listenerBound = false;

function rootElement() {
  return typeof document === 'undefined' ? null : document.documentElement;
}

export function systemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function storedTheme() {
  try {
    return window.localStorage.getItem(config.theme.storageKey);
  } catch (error) {
    return null;
  }
}

function persist(theme) {
  try {
    if (theme) window.localStorage.setItem(config.theme.storageKey, theme);
    else window.localStorage.removeItem(config.theme.storageKey);
  } catch (error) {
    return;
  }
}

export function getTheme() {
  const root = rootElement();
  const explicit = root ? root.getAttribute(config.theme.attribute) : null;
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return systemPrefersDark() ? 'dark' : 'light';
}

export function applyTheme(theme, options) {
  const root = rootElement();
  if (!root) return theme;
  const settings = options || {};
  const next = theme === 'dark' ? 'dark' : 'light';
  root.setAttribute(config.theme.attribute, next);
  root.style.colorScheme = next;
  if (settings.persist) persist(next);
  emit(root, 'themechange', { theme: next, stored: Boolean(settings.persist) });
  return next;
}

export function setTheme(theme) {
  return applyTheme(theme, { persist: true });
}

export function toggleTheme() {
  return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function clearTheme() {
  const root = rootElement();
  if (root) root.removeAttribute(config.theme.attribute);
  persist(null);
  return applyTheme(systemPrefersDark() ? 'dark' : 'light', { persist: false });
}

export function initTheme() {
  const saved = storedTheme();
  applyTheme(saved === 'dark' || saved === 'light' ? saved : systemPrefersDark() ? 'dark' : 'light', {
    persist: false
  });
  if (!listenerBound && config.theme.followSystem && typeof window !== 'undefined' && window.matchMedia) {
    listenerBound = true;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (event) {
      const current = storedTheme();
      if (current !== 'dark' && current !== 'light') applyTheme(event.matches ? 'dark' : 'light', { persist: false });
    });
  }
  return getTheme();
}
