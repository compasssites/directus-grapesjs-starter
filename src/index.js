// Import the main application class
import { DirectusGrapesJSBuilder } from './app.js';

// Import styles
import './styles.css';

// Debug: Log that the module has been loaded
console.log('Directus GrapesJS Builder module loaded');

// The app is initialized in the inline script in index.html
// This is to ensure the app is available for inline event handlers

// Export the main application class for use in other modules
export { DirectusGrapesJSBuilder } from './app.js';
