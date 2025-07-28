// Import the main application class
import DirectusGrapesJSBuilder from './app.js';

// Import styles
import './styles.css';

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize the application
    window.app = new DirectusGrapesJSBuilder();
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

// Export the main application class for use in other modules
export default DirectusGrapesJSBuilder;
