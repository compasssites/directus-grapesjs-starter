// Directus API Configuration
export const DIRECTUS_CONFIG = {
  // Default Directus instance URL (can be overridden by user)
  url: 'https://directus-oracle.panel.ballarihealth.com',
  
  // Authentication endpoints
  endpoints: {
    auth: '/auth/login',
    refresh: '/auth/refresh',
    me: '/users/me',
    collections: '/collections',
    fields: '/fields',
    items: '/items',
    files: '/files'
  },
  
  // Default collection for storing app data
  appCollection: 'builder_apps',
  
  // Default fields for the app collection
  appFields: [
    'id',
    'name',
    'layout',
    'owner',
    'date_created',
    'date_updated'
  ]
};

// GrapesJS Configuration
export const GRAPESJS_CONFIG = {
  // Container element ID
  container: '#editor',
  
  // Default block categories
  blockCategories: [
    {
      id: 'basic',
      label: 'Basic',
      order: 1
    },
    {
      id: 'directus',
      label: 'Directus',
      order: 2
    },
    {
      id: 'forms',
      label: 'Forms',
      order: 3
    },
    {
      id: 'media',
      label: 'Media',
      order: 4
    }
  ],
  
  // Default blocks
  blocks: [
    // Section
    {
      id: 'section',
      label: '<i class="fas fa-square"></i> Section',
      category: 'Basic',
      content: {
        type: 'section',
        components: [
          {
            type: 'text',
            content: 'This is a section',
            style: { padding: '20px' }
          }
        ]
      }
    },
    // Text
    {
      id: 'text',
      label: '<i class="fas fa-font"></i> Text',
      category: 'Basic',
      content: {
        type: 'text',
        content: 'Insert your text here',
        style: { padding: '10px' }
      }
    },
    // Image
    {
      id: 'image',
      label: '<i class="fas fa-image"></i> Image',
      category: 'Media',
      content: {
        type: 'image',
        attributes: { src: 'https://via.placeholder.com/350x250' },
        style: { maxWidth: '100%' }
      }
    },
    // Directus Repeater
    {
      id: 'directus-repeater',
      label: '<i class="fas fa-database"></i> Directus Data',
      category: 'Directus',
      content: {
        type: 'directus-repeater',
        attributes: { 'data-collection': '', 'data-fields': '' },
        components: [
          {
            type: 'text',
            content: 'Data will be loaded here',
            style: { padding: '20px', border: '1px dashed #999' }
          }
        ]
      }
    }
  ]
};

// UI Configuration
export const UI_CONFIG = {
  // Default theme colors
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    light: '#f9fafb',
    dark: '#111827'
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  // Default styles
  styles: {
    button: 'px-4 py-2 rounded-md font-medium transition-colors',
    input: 'w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    card: 'bg-white rounded-lg shadow-md overflow-hidden',
    panel: 'bg-white rounded-lg border border-gray-200 p-4'
  }
};

// Export all configurations
export default {
  directus: DIRECTUS_CONFIG,
  grapesjs: GRAPESJS_CONFIG,
  ui: UI_CONFIG
};
