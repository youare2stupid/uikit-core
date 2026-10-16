import { attr, findRole } from '../../runtime/config.js';
import { on, setHidden, uid } from '../../runtime/dom.js';
import { define } from '../../runtime/registry.js';
import { emit } from '../../runtime/events.js';

class UITooltip extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this._trigger = findRole(this, 'trigger');
    this._bubble = findRole(this, 'bubble');
    if (!this._trigger || !this._bubble) return;

    this._bubble.id = this._bubble.id || uid('tooltip');
    this._trigger.setAttribute('aria-describedby', this._bubble.id);
    setHidden(this._bubble, true);

    on(this._trigger, 'pointerenter', () => this.show());
    on(this._trigger, 'focusin', () => this.show());
    on(this._trigger, 'pointerleave', () => this.hide());
    on(this._trigger, 'focusout', () => this.hide());
    
    on(this, 'keydown', (event) => {
      if (event.key === 'Escape') this.hide();
    });
  }

  show() {
    if (this._isOpen) return;
    this._isOpen = true;
    setHidden(this._bubble, false);
    this._position();
    emit(this, 'show');
  }

  hide() {
    if (!this._isOpen) return;
    this._isOpen = false;
    setHidden(this._bubble, true);
    emit(this, 'hide');
  }

  _position() {
    const rect = this._trigger.getBoundingClientRect();
    const bubbleRect = this._bubble.getBoundingClientRect();
    const spacing = 8;
    
    let top = rect.top - bubbleRect.height - spacing;
    let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
    let placement = 'top';

    if (top < 0) {
      top = rect.bottom + spacing;
      placement = 'bottom';
    }

    this._bubble.style.position = 'fixed';
    this._bubble.style.top = `${top}px`;
    this._bubble.style.left = `${left}px`;
    this.setAttribute('data-placement', placement);
  }
}

define('tooltip', UITooltip);

export { UITooltip };
