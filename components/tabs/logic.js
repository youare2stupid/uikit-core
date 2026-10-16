import { attr, findRole, findRoles } from '../../runtime/config.js';
import { on, setHidden } from '../../runtime/dom.js';
import { define } from '../../runtime/registry.js';
import { emit } from '../../runtime/events.js';

class UITabs extends HTMLElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;

    this._tablist = findRole(this, 'tablist');
    this._tabs = findRoles(this, 'tab');
    this._panels = findRoles(this, 'panel');

    if (!this._tablist) return;
    this._tablist.setAttribute('role', 'tablist');

    this._tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      const targetId = tab.getAttribute(attr('target'));
      if (targetId) {
        tab.setAttribute('aria-controls', targetId);
      }

      on(tab, 'click', () => this.select(targetId));
    });

    this._panels.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
    });

    on(this._tablist, 'keydown', (event) => this._handleKeyDown(event));

    this._init();
  }

  _init() {
    const initialTab = this._tabs[0];
    if (initialTab) {
      this.select(initialTab.getAttribute(attr('target')));
    }
  }

  _handleKeyDown(event) {
    const activeTab = this._tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
    if (!activeTab) return;

    const index = this._tabs.indexOf(activeTab);
    let nextIndex;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = (index - 1 + this._tabs.length) % this._tabs.length;
        break;
      case 'ArrowRight':
        nextIndex = (index + 1) % this._tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this._tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = this._tabs[nextIndex];
    this.select(nextTab.getAttribute(attr('target')));
    nextTab.focus();
  }

  select(id) {
    if (!id) return;

    this._tabs.forEach(tab => {
      const isSelected = tab.getAttribute(attr('target')) === id;
      tab.setAttribute('aria-selected', isSelected);
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    this._panels.forEach(panel => {
      setHidden(panel, panel.id !== id);
    });

    emit(this, 'change', { value: id });
  }

  get selected() {
    return this._tabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.getAttribute(attr('target'));
  }
}

define('tabs', UITabs);

export { UITabs };
