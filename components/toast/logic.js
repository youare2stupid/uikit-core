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
    if (!toast.isConnected || toast.getAttribute('data-state') === 'closing') return;
    toast.setAttribute('data-state', 'closing');

    const animations = typeof toast.getAnimations === 'function' ? toast.getAnimations() : [];
    if (animations.length === 0) {
      toast.remove();
      return;
    }

    let pending = animations.length;
    const guard = setTimeout(function () {
      toast.remove();
    }, 800);
    const finish = function () {
      pending -= 1;
      if (pending > 0) return;
      clearTimeout(guard);
      toast.remove();
    };

    animations.forEach(function (animation) {
      if (animation.finished && typeof animation.finished.then === 'function') animation.finished.then(finish, finish);
      else animation.addEventListener('finish', finish, { once: true });
    });
  }
}

define('toast-host', UIToastHost);

export { UIToastHost };
