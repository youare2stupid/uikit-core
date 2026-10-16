import '../components/accordion/logic.js';
import '../components/drawer/logic.js';
import '../components/modal/logic.js';
import '../components/tabs/logic.js';
import '../components/toast/logic.js';
import '../components/tooltip/logic.js';

export { config, configure, defaults, tag, eventName, attr, roleSelector, findRole, findRoles } from './config.js';
export { define, defineAll, registered } from './registry.js';
export { qs, qsa, on, off, delegate, uid, setHidden, toggleClass, moveChildren } from './dom.js';
export { emit, listen } from './events.js';
export { focusables, focusFirst, focusElement, rememberFocus, restoreFocus, trapFocus, FOCUSABLE } from './focus.js';
export * as overlay from './overlay.js';
export * as theme from './theme.js';
export * as motion from './motion.js';

import { config, configure, attr, eventName, tag } from './config.js';
import { define, defineAll, registered } from './registry.js';
import { emit, listen } from './events.js';
import * as overlay from './overlay.js';
import * as theme from './theme.js';
import * as motion from './motion.js';

export const UIKit = {
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
  overlay,
  theme,
  motion
};

export default UIKit;
