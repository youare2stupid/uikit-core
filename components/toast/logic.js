import { attr } from '../../runtime/config.js';
import { on } from '../../runtime/dom.js';
import { define } from '../../runtime/registry.js';
import { emit } from '../../runtime/events.js';

class UIToastHost extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this.setAttribute('role', 'region');
    this.setAttribute('aria-live', 'polite');
  }

  push({ text, tone, timeout = 5000 }) {
    const toast = document.createElement('div');
    toast.setAttribute(attr('role'), 'toast');
    toast.setAttribute('role', 'status');
    if (tone) toast.setAttribute('data-tone', tone);
    
    toast.textContent = text;
    
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute(attr('close'), '');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    toast.appendChild(closeBtn);

    on(toast, 'click', (event) => {
      if (event.target.hasAttribute(attr('close'))) {
        this._removeToast(toast);
      }
    });

    this.appendChild(toast);
    emit(this, 'toast', { text, tone });

    if (timeout > 0) {
      setTimeout(() => this._removeToast(toast), timeout);
    }
  }

  _removeToast(toast) {
    if (!toast.isConnected) return;
    toast.remove();
  }
}

define('toast-host', UIToastHost);

export { UIToastHost };
