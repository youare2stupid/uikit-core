/*! uikit-core v0.1.0
License: MIT. */

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// runtime/config.js
var DEFAULTS = {
  tagPrefix: "ui",
  eventNs: "ui",
  attributes: {
    role: "data-ui-role",
    target: "data-ui-target",
    open: "data-ui-open",
    close: "data-ui-close"
  },
  theme: { attribute: "data-theme", storageKey: "ui-theme", followSystem: true },
  motion: { attribute: "data-ui-motion", storageKey: "ui-motion" }
};
var config = JSON.parse(JSON.stringify(DEFAULTS));
function configure(patch) {
  if (!patch) return config;
  for (const key of ["tagPrefix", "eventNs", "attributes", "theme", "motion"]) {
    if (patch[key] === void 0) continue;
    if (typeof patch[key] === "object") Object.assign(config[key], patch[key]);
    else config[key] = patch[key];
  }
  return config;
}
function tag(name) {
  return config.tagPrefix + "-" + name;
}
function eventName(name) {
  return config.eventNs + ":" + name;
}
function attr(name) {
  return config.attributes[name];
}
function roleSelector(role) {
  return "[" + config.attributes.role + '="' + role + '"]';
}
function findRole(root, role) {
  return root ? root.querySelector(roleSelector(role)) : null;
}
function findRoles(root, role) {
  return root ? Array.prototype.slice.call(root.querySelectorAll(roleSelector(role))) : [];
}
var defaults = DEFAULTS;

// runtime/dom.js
function qs(selector, root) {
  return (root || document).querySelector(selector);
}
function qsa(selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}
function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return function off2() {
    target.removeEventListener(type, handler, options);
  };
}
function off(target, type, handler, options) {
  target.removeEventListener(type, handler, options);
}
function delegate(root, selector, type, handler) {
  return on(root, type, function(event) {
    const match = event.target.closest ? event.target.closest(selector) : null;
    if (match && root.contains(match)) handler.call(match, event, match);
  });
}
function uid(prefix) {
  uid.counter = (uid.counter || 0) + 1;
  return (prefix || "ui") + "-" + uid.counter;
}
function setHidden(element, hidden) {
  if (hidden) element.setAttribute("hidden", "");
  else element.removeAttribute("hidden");
}
function toggleClass(element, name, active) {
  if (active) element.classList.add(name);
  else element.classList.remove(name);
}
function moveChildren(from, to, skip) {
  Array.prototype.slice.call(from.childNodes).forEach(function(node) {
    if (skip && skip(node)) return;
    to.appendChild(node);
  });
}

// runtime/registry.js
var registry = /* @__PURE__ */ new Map();
function define(name, elementClass) {
  registry.set(name, elementClass);
  return elementClass;
}
function registered() {
  return Array.from(registry.keys());
}
function defineAll() {
  const defined = [];
  registry.forEach(function(elementClass, name) {
    const elementTag = tag(name);
    if (typeof customElements !== "undefined" && !customElements.get(elementTag)) {
      customElements.define(elementTag, elementClass);
      defined.push(elementTag);
    }
  });
  return defined;
}

// runtime/events.js
function emit(target, name, detail) {
  return target.dispatchEvent(
    new CustomEvent(eventName(name), { bubbles: true, composed: true, detail: detail || {} })
  );
}
function listen(target, name, handler, options) {
  return on(target, eventName(name), handler, options);
}

// components/accordion/logic.js
var UIAccordion = class extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this._items = findRoles(this, "item");
    this._items.forEach((item, index) => {
      const trigger = item.querySelector('[data-ui-role="trigger"]');
      const content = item.querySelector('[data-ui-role="content"]');
      if (!trigger || !content) return;
      const contentId = content.id || uid("accordion-content");
      content.id = contentId;
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-controls", contentId);
      setHidden(content, true);
      on(trigger, "click", () => this.toggle(index));
    });
    this._init();
  }
  _init() {
    this._items.forEach((item, index) => {
      if (item.hasAttribute("open")) {
        this.toggle(index, true);
      }
    });
  }
  toggle(index, forceState = null) {
    const item = this._items[index];
    if (!item) return;
    const trigger = item.querySelector('[data-ui-role="trigger"]');
    const content = item.querySelector('[data-ui-role="content"]');
    if (!trigger || !content) return;
    const isOpen = trigger.getAttribute("aria-expanded") === "true";
    const newState = forceState !== null ? forceState : !isOpen;
    if (this.hasAttribute("single") && newState === true) {
      this._items.forEach((it, idx) => {
        if (idx !== index) {
          const t = it.querySelector('[data-ui-role="trigger"]');
          const c = it.querySelector('[data-ui-role="content"]');
          if (t) t.setAttribute("aria-expanded", "false");
          if (c) setHidden(c, true);
        }
      });
    }
    trigger.setAttribute("aria-expanded", newState);
    setHidden(content, !newState);
    emit(this, "toggle", { index, open: newState });
  }
  openAll() {
    this._items.forEach((_, index) => {
      const item = this._items[index];
      const trigger = item.querySelector('[data-ui-role="trigger"]');
      const content = item.querySelector('[data-ui-role="content"]');
      if (trigger) trigger.setAttribute("aria-expanded", "true");
      if (content) setHidden(content, false);
      emit(this, "toggle", { index, open: true });
    });
  }
  closeAll() {
    this._items.forEach((_, index) => {
      const item = this._items[index];
      const trigger = item.querySelector('[data-ui-role="trigger"]');
      const content = item.querySelector('[data-ui-role="content"]');
      if (trigger) trigger.setAttribute("aria-expanded", "false");
      if (content) setHidden(content, true);
      emit(this, "toggle", { index, open: false });
    });
  }
};
define("accordion", UIAccordion);

// runtime/overlay.js
var overlay_exports = {};
__export(overlay_exports, {
  closeOverlay: () => closeOverlay,
  closeTop: () => closeTop,
  handleBackdrop: () => handleBackdrop,
  isOverlayOpen: () => isOverlayOpen,
  openOverlay: () => openOverlay,
  openStack: () => openStack,
  toggleOverlay: () => toggleOverlay
});

// runtime/focus.js
var FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");
function focusables(root) {
  if (!root) return [];
  return Array.prototype.slice.call(root.querySelectorAll(FOCUSABLE)).filter(function(element) {
    return element.offsetParent !== null || element === document.activeElement;
  });
}
function focusFirst(root) {
  const first = focusables(root)[0];
  if (!first) {
    if (root && root.focus) root.focus({ preventScroll: true });
    return null;
  }
  focusElement(first);
  return first;
}
function focusElement(element) {
  if (!element || !element.focus) return;
  try {
    element.focus({ preventScroll: true });
  } catch (error) {
    element.focus();
  }
}
function rememberFocus() {
  return typeof HTMLElement !== "undefined" && document.activeElement instanceof HTMLElement ? document.activeElement : null;
}
function restoreFocus(element) {
  if (element && element.isConnected) focusElement(element);
}
function trapFocus(root, event) {
  if (event.key !== "Tab") return;
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

// runtime/overlay.js
var stack = [];
var bound = false;
function documentRoot() {
  return typeof document === "undefined" ? null : document;
}
function lockScroll(locked) {
  const doc = documentRoot();
  if (!doc) return;
  doc.documentElement.style.overflow = locked ? "hidden" : "";
}
function overlayHost(element) {
  return element && element.closest ? element.closest("[data-ui-overlay]") : null;
}
function resolveTarget(element) {
  const selector = element.getAttribute(attr("target"));
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
  if (selector.charAt(0) === "#") {
    const byId = doc.getElementById(selector.slice(1));
    if (byId) return byId;
  }
  return doc.querySelector("[" + attr("target") + '="' + selector + '"]');
}
function onKeydown(event) {
  const current = stack[stack.length - 1];
  if (!current) return;
  if (event.key === "Escape" && current.dismissible) {
    event.preventDefault();
    closeOverlay(current.element);
  } else if (event.key === "Tab") {
    trapFocus(current.box, event);
  }
}
function onClick(event) {
  const target = event.target;
  if (!target || !target.closest) return;
  const closer = target.closest("[" + attr("close") + "]");
  if (closer) {
    const host = overlayHost(closer);
    if (host) {
      event.preventDefault();
      closeOverlay(host);
      return;
    }
  }
  const opener = target.closest("[" + attr("open") + "]");
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
  on(doc, "keydown", onKeydown);
  on(doc, "click", onClick);
}
function isOverlayOpen(element) {
  return stack.some(function(entry) {
    return entry.element === element;
  });
}
function openOverlay(element, options) {
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
  element.setAttribute("open", "");
  element.setAttribute("data-state", "open");
  if (entry.lockScroll) lockScroll(true);
  if (settings.focus !== false) focusFirst(entry.box);
  emit(element, "open", { element });
  return entry;
}
function closeOverlay(element, options) {
  const index = stack.findIndex(function(entry2) {
    return entry2.element === element;
  });
  if (index === -1) return false;
  const entry = stack.splice(index, 1)[0];
  const settings = options || {};
  element.removeAttribute("open");
  element.setAttribute("data-state", "closed");
  if (stack.length === 0 && entry.lockScroll) lockScroll(false);
  if (settings.restoreFocus !== false) restoreFocus(entry.restoreTo);
  emit(element, "close", { element });
  return true;
}
function toggleOverlay(element, options) {
  if (isOverlayOpen(element)) return closeOverlay(element, options);
  return openOverlay(element, options);
}
function closeTop() {
  const current = stack[stack.length - 1];
  return current ? closeOverlay(current.element) : false;
}
function handleBackdrop(event, element) {
  if (!event.target || event.target === element) {
    closeOverlay(element);
    return true;
  }
  return false;
}
function openStack() {
  return stack.slice();
}
bindGlobal();

// components/overlay-element.js
var OverlayElement = class extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this.setAttribute("data-ui-overlay", "");
    if (!this.hasAttribute("data-state")) this.setAttribute("data-state", "closed");
    if (!this.id) this.id = uid(this.localName || "overlay");
    this._box = findRole(this, "box");
    if (!this._box) this._build();
    this._layer = this._box.parentElement;
    on(this, "click", (event) => {
      if (event.target === this._layer) closeOverlay(this);
    });
  }
  buildBox(box) {
    return box;
  }
  isTrigger(node) {
    return node.nodeType === 1 && node.hasAttribute(attr("open"));
  }
  _build() {
    const layer = document.createElement("div");
    layer.setAttribute(attr("role"), "layer");
    const box = this.buildBox(document.createElement("div"));
    box.setAttribute(attr("role"), "box");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("tabindex", "-1");
    moveChildren(this, box, (node) => this.isTrigger(node));
    layer.appendChild(box);
    this.appendChild(layer);
    this._box = box;
  }
  open() {
    return openOverlay(this, { box: this._box });
  }
  close() {
    return closeOverlay(this);
  }
  toggle() {
    return this.isOpen ? this.close() : this.open();
  }
  get isOpen() {
    return isOverlayOpen(this);
  }
  get box() {
    return this._box;
  }
};

// components/drawer/logic.js
var UIDrawer = class extends OverlayElement {
  static get observedAttributes() {
    return ["side"];
  }
  buildBox(box) {
    box.setAttribute("data-side", this.getAttribute("side") || "end");
    return box;
  }
  attributeChangedCallback(name, previous, next) {
    if (name === "side" && this.box) this.box.setAttribute("data-side", next || "end");
  }
};
define("drawer", UIDrawer);

// components/modal/logic.js
var UIModal = class extends OverlayElement {
};
define("modal", UIModal);

// components/tabs/logic.js
var UITabs = class extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this._tablist = findRole(this, "tablist");
    this._tabs = findRoles(this, "tab");
    this._panels = findRoles(this, "panel");
    if (!this._tablist) return;
    this._tablist.setAttribute("role", "tablist");
    this._tabs.forEach((tab, index) => {
      tab.setAttribute("role", "tab");
      const targetId = tab.getAttribute(attr("target"));
      if (targetId) {
        tab.setAttribute("aria-controls", targetId);
      }
      on(tab, "click", () => this.select(targetId));
    });
    this._panels.forEach((panel) => {
      panel.setAttribute("role", "tabpanel");
    });
    on(this._tablist, "keydown", (event) => this._handleKeyDown(event));
    this._init();
  }
  _init() {
    const initialTab = this._tabs[0];
    if (initialTab) {
      this.select(initialTab.getAttribute(attr("target")));
    }
  }
  _handleKeyDown(event) {
    const activeTab = this._tabs.find((tab) => tab.getAttribute("aria-selected") === "true");
    if (!activeTab) return;
    const index = this._tabs.indexOf(activeTab);
    let nextIndex;
    switch (event.key) {
      case "ArrowLeft":
        nextIndex = (index - 1 + this._tabs.length) % this._tabs.length;
        break;
      case "ArrowRight":
        nextIndex = (index + 1) % this._tabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = this._tabs.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const nextTab = this._tabs[nextIndex];
    this.select(nextTab.getAttribute(attr("target")));
    nextTab.focus();
  }
  select(id) {
    if (!id) return;
    this._tabs.forEach((tab) => {
      const isSelected = tab.getAttribute(attr("target")) === id;
      tab.setAttribute("aria-selected", isSelected);
      tab.setAttribute("tabindex", isSelected ? "0" : "-1");
    });
    this._panels.forEach((panel) => {
      setHidden(panel, panel.id !== id);
    });
    emit(this, "change", { value: id });
  }
  get selected() {
    var _a;
    return (_a = this._tabs.find((tab) => tab.getAttribute("aria-selected") === "true")) == null ? void 0 : _a.getAttribute(attr("target"));
  }
};
define("tabs", UITabs);

// components/toast/logic.js
var UIToastHost = class extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this.setAttribute("role", "region");
    this.setAttribute("aria-live", "polite");
  }
  push({ text, tone, timeout = 5e3 }) {
    const toast = document.createElement("div");
    toast.setAttribute(attr("role"), "toast");
    toast.setAttribute("role", "status");
    if (tone) toast.setAttribute("data-tone", tone);
    toast.textContent = text;
    const closeBtn = document.createElement("button");
    closeBtn.setAttribute(attr("close"), "");
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "\xD7";
    toast.appendChild(closeBtn);
    on(toast, "click", (event) => {
      if (event.target.hasAttribute(attr("close"))) {
        this._removeToast(toast);
      }
    });
    this.appendChild(toast);
    emit(this, "toast", { text, tone });
    if (timeout > 0) {
      setTimeout(() => this._removeToast(toast), timeout);
    }
  }
  _removeToast(toast) {
    if (!toast.isConnected) return;
    toast.remove();
  }
};
define("toast-host", UIToastHost);

// components/tooltip/logic.js
var UITooltip = class extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this._trigger = findRole(this, "trigger");
    this._bubble = findRole(this, "bubble");
    if (!this._trigger || !this._bubble) return;
    this._bubble.id = this._bubble.id || uid("tooltip");
    this._trigger.setAttribute("aria-describedby", this._bubble.id);
    setHidden(this._bubble, true);
    on(this._trigger, "pointerenter", () => this.show());
    on(this._trigger, "focusin", () => this.show());
    on(this._trigger, "pointerleave", () => this.hide());
    on(this._trigger, "focusout", () => this.hide());
    on(this, "keydown", (event) => {
      if (event.key === "Escape") this.hide();
    });
  }
  show() {
    if (this._isOpen) return;
    this._isOpen = true;
    setHidden(this._bubble, false);
    this._position();
    emit(this, "show");
  }
  hide() {
    if (!this._isOpen) return;
    this._isOpen = false;
    setHidden(this._bubble, true);
    emit(this, "hide");
  }
  _position() {
    const rect = this._trigger.getBoundingClientRect();
    const bubbleRect = this._bubble.getBoundingClientRect();
    const spacing = 8;
    let top = rect.top - bubbleRect.height - spacing;
    let left = rect.left + rect.width / 2 - bubbleRect.width / 2;
    let placement = "top";
    if (top < 0) {
      top = rect.bottom + spacing;
      placement = "bottom";
    }
    this._bubble.style.position = "fixed";
    this._bubble.style.top = `${top}px`;
    this._bubble.style.left = `${left}px`;
    this.setAttribute("data-placement", placement);
  }
};
define("tooltip", UITooltip);

// runtime/theme.js
var theme_exports = {};
__export(theme_exports, {
  applyTheme: () => applyTheme,
  clearTheme: () => clearTheme,
  getTheme: () => getTheme,
  initTheme: () => initTheme,
  setTheme: () => setTheme,
  storedTheme: () => storedTheme,
  systemPrefersDark: () => systemPrefersDark,
  toggleTheme: () => toggleTheme
});
var listenerBound = false;
function rootElement() {
  return typeof document === "undefined" ? null : document.documentElement;
}
function systemPrefersDark() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function storedTheme() {
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
function getTheme() {
  const root = rootElement();
  const explicit = root ? root.getAttribute(config.theme.attribute) : null;
  if (explicit === "dark" || explicit === "light") return explicit;
  return systemPrefersDark() ? "dark" : "light";
}
function applyTheme(theme, options) {
  const root = rootElement();
  if (!root) return theme;
  const settings = options || {};
  const next = theme === "dark" ? "dark" : "light";
  root.setAttribute(config.theme.attribute, next);
  root.style.colorScheme = next;
  if (settings.persist) persist(next);
  emit(root, "themechange", { theme: next, stored: Boolean(settings.persist) });
  return next;
}
function setTheme(theme) {
  return applyTheme(theme, { persist: true });
}
function toggleTheme() {
  return setTheme(getTheme() === "dark" ? "light" : "dark");
}
function clearTheme() {
  const root = rootElement();
  if (root) root.removeAttribute(config.theme.attribute);
  persist(null);
  return applyTheme(systemPrefersDark() ? "dark" : "light", { persist: false });
}
function initTheme() {
  const saved = storedTheme();
  applyTheme(saved === "dark" || saved === "light" ? saved : systemPrefersDark() ? "dark" : "light", {
    persist: false
  });
  if (!listenerBound && config.theme.followSystem && typeof window !== "undefined" && window.matchMedia) {
    listenerBound = true;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(event) {
      const current = storedTheme();
      if (current !== "dark" && current !== "light") applyTheme(event.matches ? "dark" : "light", { persist: false });
    });
  }
  return getTheme();
}

// runtime/motion.js
var motion_exports = {};
__export(motion_exports, {
  getMotion: () => getMotion,
  initMotion: () => initMotion,
  motionEnabled: () => motionEnabled,
  prefersReducedMotion: () => prefersReducedMotion,
  setMotion: () => setMotion,
  storedMotion: () => storedMotion
});
function rootElement2() {
  return typeof document === "undefined" ? null : document.documentElement;
}
function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function storedMotion() {
  try {
    return window.localStorage.getItem(config.motion.storageKey);
  } catch (error) {
    return null;
  }
}
function getMotion() {
  const root = rootElement2();
  const explicit = root ? root.getAttribute(config.motion.attribute) : null;
  if (explicit === "off" || explicit === "on") return explicit;
  return "auto";
}
function setMotion(mode) {
  const root = rootElement2();
  const next = mode === "on" || mode === "off" ? mode : "auto";
  if (root) {
    if (next === "auto") root.removeAttribute(config.motion.attribute);
    else root.setAttribute(config.motion.attribute, next);
  }
  try {
    if (next === "auto") window.localStorage.removeItem(config.motion.storageKey);
    else window.localStorage.setItem(config.motion.storageKey, next);
  } catch (error) {
    emit(root, "motionchange", { motion: next, stored: false });
    return next;
  }
  emit(root, "motionchange", { motion: next, stored: true });
  return next;
}
function motionEnabled() {
  const mode = getMotion();
  if (mode === "off") return false;
  if (mode === "on") return true;
  return !prefersReducedMotion();
}
function initMotion() {
  const saved = storedMotion();
  if (saved === "on" || saved === "off") setMotion(saved);
  return getMotion();
}

// runtime/index.js
var UIKit = {
  config,
  configure,
  attr,
  tag,
  eventName,
  define,
  defineAll,
  registered,
  emit,
  listen,
  overlay: overlay_exports,
  theme: theme_exports,
  motion: motion_exports
};
var index_default = UIKit;
export {
  FOCUSABLE,
  UIKit,
  attr,
  config,
  configure,
  index_default as default,
  defaults,
  define,
  defineAll,
  delegate,
  emit,
  eventName,
  findRole,
  findRoles,
  focusElement,
  focusFirst,
  focusables,
  listen,
  motion_exports as motion,
  moveChildren,
  off,
  on,
  overlay_exports as overlay,
  qs,
  qsa,
  registered,
  rememberFocus,
  restoreFocus,
  roleSelector,
  setHidden,
  tag,
  theme_exports as theme,
  toggleClass,
  trapFocus,
  uid
};
