import { define } from '../../runtime/registry.js';
import { OverlayElement } from '../overlay-element.js';

class UIDrawer extends OverlayElement {
  static get observedAttributes() {
    return ['side'];
  }

  buildBox(box) {
    box.setAttribute('data-side', this.getAttribute('side') || 'end');
    return box;
  }

  attributeChangedCallback(name, previous, next) {
    if (name === 'side' && this.box) this.box.setAttribute('data-side', next || 'end');
  }
}

define('drawer', UIDrawer);

export { UIDrawer };
