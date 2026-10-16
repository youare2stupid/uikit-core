import * as library from './index.js';

if (typeof window !== 'undefined') {
  if (window.UIKitConfig) library.configure(window.UIKitConfig);
  library.defineAll();
  window.UIKit = library;
}

export default library;
