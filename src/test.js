console.log('Test script loaded successfully!');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  
  // Create a test element
  const testElement = document.createElement('div');
  testElement.id = 'test-element';
  testElement.textContent = 'Test script is working!';
  testElement.style.cssText = 'position: fixed; top: 10px; left: 10px; background: #4CAF50; color: white; padding: 10px; z-index: 10000;';
  
  // Add the test element to the page
  document.body.appendChild(testElement);
  console.log('Test element added to the page');
  
  // Check if GrapesJS is available
  if (typeof grapesjs !== 'undefined') {
    console.log('GrapesJS is available:', grapesjs);
  } else {
    console.error('GrapesJS is not available');
  }
});
