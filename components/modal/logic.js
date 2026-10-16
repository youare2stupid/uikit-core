import { define } from '../../runtime/registry.js';
import { OverlayElement } from '../overlay-element.js';

class UIModal extends OverlayElement {}

define('modal', UIModal);

export { UIModal };
