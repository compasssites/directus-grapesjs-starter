import { createDirectus, rest, authentication, readCollections, readFieldsByCollection, readItems, createItem, updateItem, deleteItem, readMe } from '@directus/sdk';
import './styles.css';

class DirectusGrapesJSBuilder {
  constructor() {
    this.directusClient = null;
    this.currentUser = null;
    this.selectedCollection = null;
    this.selectedFields = [];
    this.currentApp = null;
    this.apps = [];
    this.editor = null;
    
    // Initialize the application
    this.init();
  }

  async init() {
    console.log('Initializing Directus GrapesJS Builder...');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check if user is already authenticated
    const savedAuth = localStorage.getItem('directus-auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        await this.connectToDirectus(authData.url, authData.email, authData.password);
      } catch (error) {
        console.log('Saved auth invalid, showing login form');
        localStorage.removeItem('directus-auth');
      }
    }
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    // Navigation tabs
    this.setupNavigation();
    
    // User menu
    this.setupUserMenu();
    
    // Mobile menu
    this.setupMobileMenu();
    
    // App management
    this.setupAppManagement();
  }

  setupNavigation() {
    const tabs = ['apps', 'editor', 'collections'];
    
    tabs.forEach(tab => {
      const tabElement = document.getElementById(`${tab}-tab`);
      const mobileTabElement = document.getElementById(`mobile-${tab}-tab`);
      
      if (tabElement) {
        tabElement.addEventListener('click', (e) => {
          e.preventDefault();
          this.showView(tab);
        });
      }
      
      if (mobileTabElement) {
        mobileTabElement.addEventListener('click', (e) => {
          e.preventDefault();
          this.showView(tab);
          this.closeMobileMenu();
        });
      }
    });
  }

  setupUserMenu() {
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener('click', () => {
        userDropdown.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.add('hidden');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  }

  setupAppManagement() {
    const newAppBtn = document.getElementById('new-app-btn');
    const saveBtn = document.getElementById('save-btn');
    const saveAppBtn = document.getElementById('save-app-btn');
    const previewBtn = document.getElementById('preview-btn');

    if (newAppBtn) {
      newAppBtn.addEventListener('click', () => this.createNewApp());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentApp());
    }

    if (saveAppBtn) {
      saveAppBtn.addEventListener('click', () => this.saveCurrentApp());
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.togglePreview());
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const url = formData.get('directus-url');
    const email = formData.get('email');
    const password = formData.get('password');

    const loginBtn = document.getElementById('login-btn');
    const loginLoading = document.getElementById('login-loading');

    try {
      // Show loading state
      loginBtn.classList.add('hidden');
      loginLoading.classList.remove('hidden');

      await this.connectToDirectus(url, email, password);
      
      // Save auth data
      localStorage.setItem('directus-auth', JSON.stringify({ url, email, password }));
      
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
      
      // Reset form state
      loginBtn.classList.remove('hidden');
      loginLoading.classList.add('hidden');
    }
  }

  async connectToDirectus(url, email, password) {
    try {
      // Create Directus client
      this.directusClient = createDirectus(url).with(rest()).with(authentication());
      
      // Authenticate
      await this.directusClient.login({ email, password });
      
      // Get current user
      this.currentUser = await this.directusClient.request(readMe());
      
      console.log('Connected to Directus successfully');
      
      // Load collections and apps
      await this.loadCollections();
      await this.loadApps();
      
      // Show main app
      this.showMainApp();
      
    } catch (error) {
      console.error('Failed to connect to Directus:', error);
      throw new Error('Failed to connect to Directus: ' + error.message);
    }
  }

  showMainApp() {
    // Hide auth container
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app');

    if (authContainer) authContainer.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    // Update user info
    this.updateUserInfo();
    
    // Show apps view by default
    this.showView('apps');
  }

  updateUserInfo() {
    if (!this.currentUser) return;

    const userEmail = document.getElementById('user-email');
    const mobileUserEmail = document.getElementById('mobile-user-email');
    const userAvatar = document.getElementById('user-avatar');
    const mobileUserAvatar = document.getElementById('mobile-user-avatar');

    const email = this.currentUser.email || 'user@example.com';
    const initials = email.split('@')[0].substring(0, 2).toUpperCase();

    if (userEmail) userEmail.textContent = email;
    if (mobileUserEmail) mobileUserEmail.textContent = email;
    
    if (userAvatar) {
      userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff`;
    }
    if (mobileUserAvatar) {
      mobileUserAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff`;
    }
  }

  showView(viewName) {
    // Hide all views
    const views = ['apps-view', 'editor-view', 'collections-view'];
    views.forEach(view => {
      const element = document.getElementById(view);
      if (element) element.classList.add('hidden');
    });

    // Show selected view
    const selectedView = document.getElementById(`${viewName}-view`);
    if (selectedView) selectedView.classList.remove('hidden');

    // Update navigation
    this.updateNavigation(viewName);

    // Initialize view-specific functionality
    if (viewName === 'editor' && !this.editor) {
      this.initializeEditor();
    } else if (viewName === 'collections') {
      this.loadCollectionsTable();
    }
  }

  updateNavigation(activeTab) {
    const tabs = ['apps', 'editor', 'collections'];
    
    tabs.forEach(tab => {
      const tabElement = document.getElementById(`${tab}-tab`);
      const mobileTabElement = document.getElementById(`mobile-${tab}-tab`);
      
      if (tabElement) {
        if (tab === activeTab) {
          tabElement.classList.remove('border-transparent', 'text-gray-500');
          tabElement.classList.add('border-blue-500', 'text-gray-900');
        } else {
          tabElement.classList.add('border-transparent', 'text-gray-500');
          tabElement.classList.remove('border-blue-500', 'text-gray-900');
        }
      }
      
      if (mobileTabElement) {
        if (tab === activeTab) {
          mobileTabElement.classList.remove('border-transparent', 'text-gray-600');
          mobileTabElement.classList.add('bg-blue-50', 'border-blue-500', 'text-blue-700');
        } else {
          mobileTabElement.classList.add('border-transparent', 'text-gray-600');
          mobileTabElement.classList.remove('bg-blue-50', 'border-blue-500', 'text-blue-700');
        }
      }
    });
  }

  closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
  }

  async loadCollections() {
    if (!this.directusClient) return;

    try {
      const collections = await this.directusClient.request(readCollections());
      this.collections = collections.filter(col => !col.collection.startsWith('directus_'));
      
      console.log('Loaded collections:', this.collections.length);
      
      // Update collections list in sidebar
      this.updateCollectionsList();
      
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  updateCollectionsList() {
    const collectionsListEl = document.getElementById('collections-list');
    if (!collectionsListEl || !this.collections) return;

    collectionsListEl.innerHTML = '';
    
    this.collections.forEach(collection => {
      const li = document.createElement('li');
      li.className = 'cursor-pointer px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm';
      li.textContent = collection.collection;
      li.addEventListener('click', () => this.selectCollection(collection.collection));
      collectionsListEl.appendChild(li);
    });
  }

  async selectCollection(collectionName) {
    this.selectedCollection = collectionName;
    
    if (!this.directusClient) return;

    try {
      const fields = await this.directusClient.request(readFieldsByCollection(collectionName));
      
      // Update fields list
      this.updateFieldsList(fields);
      
      // Show fields container
      const fieldsContainer = document.getElementById('fields-container-sidebar');
      if (fieldsContainer) fieldsContainer.classList.remove('hidden');
      
    } catch (error) {
      console.error('Failed to load fields:', error);
    }
  }

  updateFieldsList(fields) {
    const fieldsListEl = document.getElementById('fields-list-sidebar');
    if (!fieldsListEl) return;

    fieldsListEl.innerHTML = '';
    
    fields.forEach(field => {
      const wrapper = document.createElement('div');
      wrapper.className = 'flex items-center space-x-2';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = field.field;
      checkbox.id = `field-${field.field}`;
      checkbox.className = 'rounded border-gray-300 text-blue-600 focus:ring-blue-500';
      
      const label = document.createElement('label');
      label.htmlFor = checkbox.id;
      label.textContent = field.field;
      label.className = 'text-sm text-gray-700 cursor-pointer';
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      fieldsListEl.appendChild(wrapper);
    });

    // Setup select all functionality
    const selectAllBtn = document.getElementById('select-all-fields');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const checkboxes = fieldsListEl.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
      });
    }

    // Setup use selected fields button
    const setSelectionBtn = document.getElementById('set-selection-sidebar');
    if (setSelectionBtn) {
      setSelectionBtn.addEventListener('click', () => {
        const checkboxes = fieldsListEl.querySelectorAll('input[type="checkbox"]:checked');
        this.selectedFields = Array.from(checkboxes).map(cb => cb.value);
        
        if (this.selectedFields.length === 0) {
          alert('Please select at least one field.');
          return;
        }
        
        console.log('Selected fields:', this.selectedFields);
        alert(`Selected ${this.selectedFields.length} fields for ${this.selectedCollection}`);
      });
    }
  }

  async loadApps() {
    // For now, we'll use localStorage to store apps
    // In a real implementation, you'd store these in Directus
    const savedApps = localStorage.getItem('directus-apps');
    if (savedApps) {
      this.apps = JSON.parse(savedApps);
    } else {
      this.apps = [];
    }
    
    this.updateAppsList();
  }

  updateAppsList() {
    const appListEl = document.getElementById('app-list');
    if (!appListEl) return;

    if (this.apps.length === 0) {
      appListEl.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-plus-circle text-4xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No apps yet</h3>
          <p class="text-gray-500 mb-4">Get started by creating your first app</p>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-plus mr-2"></i>Create App
          </button>
        </div>
      `;
      return;
    }

    appListEl.innerHTML = '';
    
    this.apps.forEach(app => {
      const appCard = document.createElement('div');
      appCard.className = 'app-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer';
      appCard.innerHTML = `
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">${app.name}</h3>
            <div class="flex space-x-2">
              <button class="edit-app text-gray-400 hover:text-blue-600" data-app-id="${app.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="delete-app text-gray-400 hover:text-red-600" data-app-id="${app.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <p class="text-gray-600 text-sm mb-4">${app.description || 'No description'}</p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>Updated ${new Date(app.updated_at).toLocaleDateString()}</span>
            <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Published</span>
          </div>
        </div>
      `;
      
      // Add click handler to open app
      appCard.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          this.openApp(app);
        }
      });
      
      appListEl.appendChild(appCard);
    });

    // Add event listeners for edit and delete buttons
    appListEl.addEventListener('click', (e) => {
      if (e.target.closest('.edit-app')) {
        const appId = e.target.closest('.edit-app').dataset.appId;
        const app = this.apps.find(a => a.id === appId);
        if (app) this.openApp(app);
      } else if (e.target.closest('.delete-app')) {
        const appId = e.target.closest('.delete-app').dataset.appId;
        if (confirm('Are you sure you want to delete this app?')) {
          this.deleteApp(appId);
        }
      }
    });
  }

  createNewApp() {
    const name = prompt('Enter app name:');
    if (!name) return;

    const newApp = {
      id: Date.now().toString(),
      name: name,
      description: '',
      layout: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.apps.push(newApp);
    this.saveApps();
    this.updateAppsList();
    this.openApp(newApp);
  }

  openApp(app) {
    this.currentApp = app;
    
    // Update current app name
    const currentAppName = document.getElementById('current-app-name');
    if (currentAppName) currentAppName.textContent = app.name;
    
    // Show editor view
    this.showView('editor');
    
    // Load app layout if exists
    if (app.layout && this.editor) {
      this.editor.loadProjectData(app.layout);
    }
  }

  saveCurrentApp() {
    if (!this.currentApp || !this.editor) return;

    this.currentApp.layout = this.editor.getProjectData();
    this.currentApp.updated_at = new Date().toISOString();
    
    this.saveApps();
    alert('App saved successfully!');
  }

  deleteApp(appId) {
    this.apps = this.apps.filter(app => app.id !== appId);
    this.saveApps();
    this.updateAppsList();
  }

  saveApps() {
    localStorage.setItem('directus-apps', JSON.stringify(this.apps));
  }

  initializeEditor() {
    if (this.editor) return;

    // Wait for GrapesJS to be available
    if (typeof grapesjs === 'undefined') {
      console.error('GrapesJS is not loaded');
      return;
    }

    try {
      this.editor = grapesjs.init({
        container: '#editor',
        height: '100%',
        width: 'auto',
        storageManager: false,
        blockManager: {
          appendTo: '#blocks-container'
        },
        styleManager: {
          appendTo: '#styles-container'
        },
        layerManager: {
          appendTo: '#layers-container'
        },
        traitManager: {
          appendTo: '#traits-container'
        },
        selectorManager: {
          appendTo: '#selectors-container'
        },
        panels: {
          defaults: []
        },
        deviceManager: {
          devices: [
            {
              name: 'Desktop',
              width: '',
            },
            {
              name: 'Tablet',
              width: '768px',
              widthMedia: '992px',
            },
            {
              name: 'Mobile',
              width: '320px',
              widthMedia: '768px',
            }
          ]
        }
      });

      // Add basic blocks
      this.addBasicBlocks();
      
      // Add Directus blocks
      this.addDirectusBlocks();
      
      console.log('GrapesJS editor initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize GrapesJS editor:', error);
    }
  }

  addBasicBlocks() {
    if (!this.editor) return;

    const blockManager = this.editor.BlockManager;

    // Text block
    blockManager.add('text', {
      label: 'Text',
      category: 'Basic',
      content: '<div class="p-4"><p class="text-base">Insert your text here...</p></div>',
      attributes: { class: 'fa fa-font' }
    });

    // Heading block
    blockManager.add('heading', {
      label: 'Heading',
      category: 'Basic',
      content: '<div class="p-4"><h2 class="text-2xl font-bold">Heading</h2></div>',
      attributes: { class: 'fa fa-heading' }
    });

    // Image block
    blockManager.add('image', {
      label: 'Image',
      category: 'Basic',
      content: {
        type: 'image',
        src: 'https://via.placeholder.com/600x400',
        style: { width: '100%', height: 'auto' }
      },
      attributes: { class: 'fa fa-image' }
    });

    // Button block
    blockManager.add('button', {
      label: 'Button',
      category: 'Basic',
      content: '<div class="p-4"><button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">Click me</button></div>',
      attributes: { class: 'fa fa-hand-pointer' }
    });

    // Container block
    blockManager.add('container', {
      label: 'Container',
      category: 'Layout',
      content: '<div class="container mx-auto px-4 py-8"><p class="text-gray-500 text-center">Drop components here</p></div>',
      attributes: { class: 'fa fa-square' }
    });

    // Row block
    blockManager.add('row', {
      label: 'Row',
      category: 'Layout',
      content: '<div class="flex flex-wrap -mx-2"><div class="w-full md:w-1/2 px-2 mb-4"><p class="text-gray-500 text-center p-4 border-2 border-dashed border-gray-300">Column 1</p></div><div class="w-full md:w-1/2 px-2 mb-4"><p class="text-gray-500 text-center p-4 border-2 border-dashed border-gray-300">Column 2</p></div></div>',
      attributes: { class: 'fa fa-columns' }
    });
  }

  addDirectusBlocks() {
    if (!this.editor) return;

    // Define Directus repeater component
    this.editor.DomComponents.addType('directus-repeater', {
      model: {
        defaults: {
          tagName: 'div',
          attributes: { class: 'directus-repeater' },
          traits: [
            {
              type: 'select',
              name: 'collection',
              label: 'Collection',
              options: this.collections ? this.collections.map(c => ({ value: c.collection, name: c.collection })) : []
            },
            {
              type: 'text',
              name: 'fields',
              label: 'Fields (comma separated)',
              placeholder: 'id,title,description'
            },
            {
              type: 'number',
              name: 'limit',
              label: 'Limit',
              placeholder: '10'
            }
          ]
        },
        init() {
          this.on('change:attributes', this.updateContent);
          this.updateContent();
        },
        updateContent() {
          const collection = this.getAttributes().collection;
          const fields = this.getAttributes().fields;
          const limit = this.getAttributes().limit || 10;

          if (!collection || !this.directusClient) {
            this.components(`
              <div class="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                <i class="fas fa-database text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Directus Repeater</h3>
                <p class="text-gray-500">Select a collection and fields to display data</p>
              </div>
            `);
            return;
          }

          // In a real implementation, you would fetch data here
          // For now, we'll show a placeholder
          this.components(`
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              ${Array.from({ length: Math.min(limit, 3) }, (_, i) => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
                  <div class="p-6">
                    <h3 class="text-lg font-semibold mb-2">Item ${i + 1}</h3>
                    <p class="text-gray-600">Data from ${collection}</p>
                    ${fields ? `<p class="text-sm text-gray-500 mt-2">Fields: ${fields}</p>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `);
        }
      }
    });

    // Add Directus repeater block
    this.editor.BlockManager.add('directus-repeater', {
      label: 'Data Repeater',
      category: 'Directus',
      content: { type: 'directus-repeater' },
      attributes: { class: 'fa fa-database' }
    });

    // Add Directus form block
    this.editor.BlockManager.add('directus-form', {
      label: 'Form',
      category: 'Directus',
      content: `
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold mb-4">Contact Form</h3>
          <form class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Send Message
            </button>
          </form>
        </div>
      `,
      attributes: { class: 'fa fa-wpforms' }
    });
  }

  togglePreview() {
    if (!this.editor) return;
    
    const isPreview = this.editor.Commands.isActive('preview');
    this.editor.runCommand(isPreview ? 'preview-stop' : 'preview');
    
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
      const icon = previewBtn.querySelector('i');
      if (isPreview) {
        icon.className = 'fas fa-eye mr-1.5';
        previewBtn.innerHTML = '<i class="fas fa-eye mr-1.5"></i> Preview';
      } else {
        icon.className = 'fas fa-edit mr-1.5';
        previewBtn.innerHTML = '<i class="fas fa-edit mr-1.5"></i> Edit';
      }
    }
  }

  async loadCollectionsTable() {
    const tableBody = document.getElementById('collections-table-body');
    if (!tableBody || !this.collections) return;

    tableBody.innerHTML = '';
    
    for (const collection of this.collections) {
      try {
        // Get item count (simplified)
        const items = await this.directusClient.request(readItems(collection.collection, { limit: 1 }));
        const itemCount = items.length > 0 ? '1+' : '0';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <i class="fas fa-table text-gray-400 mr-3"></i>
              <div class="text-sm font-medium text-gray-900">${collection.collection}</div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Collection
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${itemCount} items
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
            <button class="text-gray-600 hover:text-gray-900">Edit</button>
          </td>
        `;
        
        tableBody.appendChild(row);
      } catch (error) {
        console.error(`Failed to get info for collection ${collection.collection}:`, error);
      }
    }
  }

  logout() {
    // Clear auth data
    localStorage.removeItem('directus-auth');
    localStorage.removeItem('directus-apps');
    
    // Reset state
    this.directusClient = null;
    this.currentUser = null;
    this.apps = [];
    this.currentApp = null;
    
    // Show auth container
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app');
    
    if (authContainer) authContainer.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    
    // Reset form
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
  }
}

// Make the class available globally
window.DirectusGrapesJSBuilder = DirectusGrapesJSBuilder;

export default DirectusGrapesJSBuilder;