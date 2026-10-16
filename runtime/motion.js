import { config } from './config.js';
import { emit } from './events.js';

function rootElement() {
  return typeof document === 'undefined' ? null : document.documentElement;
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function storedMotion() {
  try {
    return window.localStorage.getItem(config.motion.storageKey);
  } catch (error) {
    return null;
  }
}

export function getMotion() {
  const root = rootElement();
  const explicit = root ? root.getAttribute(config.motion.attribute) : null;
  if (explicit === 'off' || explicit === 'on') return explicit;
  return 'auto';
}

export function setMotion(mode) {
  const root = rootElement();
  const next = mode === 'on' || mode === 'off' ? mode : 'auto';
  if (root) {
    if (next === 'auto') root.removeAttribute(config.motion.attribute);
    else root.setAttribute(config.motion.attribute, next);
  }
  try {
    if (next === 'auto') window.localStorage.removeItem(config.motion.storageKey);
    else window.localStorage.setItem(config.motion.storageKey, next);
  } catch (error) {
    emit(root, 'motionchange', { motion: next, stored: false });
    return next;
  }
  emit(root, 'motionchange', { motion: next, stored: true });
  return next;
}

export function motionEnabled() {
  const mode = getMotion();
  if (mode === 'off') return false;
  if (mode === 'on') return true;
  return !prefersReducedMotion();
}

export function initMotion() {
  const saved = storedMotion();
  if (saved === 'on' || saved === 'off') setMotion(saved);
  return getMotion();
}
