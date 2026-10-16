import { attr, findRole } from '../runtime/config.js';
import { moveChildren, on, uid } from '../runtime/dom.js';
import { closeOverlay, isOverlayOpen, openOverlay } from '../runtime/overlay.js';

class OverlayElement extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this.setAttribute('data-ui-overlay', '');
    if (!this.hasAttribute('data-state')) this.setAttribute('data-state', 'closed');
    if (!this.id) this.id = uid(this.localName || 'overlay');
    this._box = findRole(this, 'box');
    if (!this._box) this._build();
    this._layer = this._box.parentElement;
    on(this, 'click', (event) => {
      if (event.target === this._layer) closeOverlay(this);
    });
  }

  buildBox(box) {
    return box;
  }

  isTrigger(node) {
    return node.nodeType === 1 && node.hasAttribute(attr('open'));
  }

  _build() {
    const layer = document.createElement('div');
    layer.setAttribute(attr('role'), 'layer');
    const box = this.buildBox(document.createElement('div'));
    box.setAttribute(attr('role'), 'box');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('tabindex', '-1');
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
}

export { OverlayElement };
