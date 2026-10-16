import { attr, findRoles } from '../../runtime/config.js';
import { on, setHidden, uid } from '../../runtime/dom.js';
import { define } from '../../runtime/registry.js';
import { emit } from '../../runtime/events.js';

class UIAccordion extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;

    this._items = findRoles(this, 'item');

    this._items.forEach((item, index) => {
      const trigger = item.querySelector('[data-ui-role="trigger"]');
      const content = item.querySelector('[data-ui-role="content"]');

      if (!trigger || !content) return;

      const contentId = content.id || uid('accordion-content');
      content.id = contentId;

      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', contentId);
      setHidden(content, true);

      on(trigger, 'click', () => this.toggle(index));
    });

    this._init();
  }

  _init() {
    this._items.forEach((item, index) => {
      if (item.hasAttribute('open')) {
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

    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    const newState = forceState !== null ? forceState : !isOpen;

    if (this.hasAttribute('single') && newState === true) {
      this._items.forEach((it, idx) => {
        if (idx !== index) {
          const t = it.querySelector('[data-ui-role="trigger"]');
          const c = it.querySelector('[data-ui-role="content"]');
          if (t) t.setAttribute('aria-expanded', 'false');
          if (c) setHidden(c, true);
        }
      });
    }

    trigger.setAttribute('aria-expanded', newState);
    setHidden(content, !newState);
    emit(this, 'toggle', { index, open: newState });
  }

  openAll() {
    this._items.forEach((_, index) => {
      const item = this._items[index];
      const trigger = item.querySelector('[data-ui-role="trigger"]');
      const content = item.querySelector('[data-ui-role="content"]');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      if (content) setHidden(content, false);
      emit(this, 'toggle', { index, open: true });
    });
  }

  closeAll() {
    this._items.forEach((_, index) => {
      const item = this._items[index];
      const trigger = item.querySelector('[data-ui-role="trigger"]');
      const content = item.querySelector('[data-ui-role="content"]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (content) setHidden(content, true);
      emit(this, 'toggle', { index, open: false });
    });
  }
}

define('accordion', UIAccordion);

export { UIAccordion };
