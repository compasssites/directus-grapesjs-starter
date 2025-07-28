// Import GrapesJS and its plugins
// Import GrapesJS and its plugins
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapesjs/dist/grapes.min.js';
import grapesJSPresetWebpage from 'grapesjs-preset-webpage';
import 'grapesjs-preset-webpage/dist/grapesjs-preset-webpage.min.css';

// Import Directus SDK
import { 
  createDirectus, 
  rest, 
  authentication, 
  staticToken, 
  readItems, 
  readMe, 
  updateItem, 
  createItem, 
  deleteItem 
} from '@directus/sdk';

// Directus REST API client
class DirectusClient {
  constructor() {
    // Get configuration from environment variables
    this.baseURL = process.env.DIRECTUS_URL || '';
    this.token = process.env.DIRECTUS_TOKEN || null;
    
    // Remove trailing slash if present
    if (this.baseURL.endsWith('/')) {
      this.baseURL = this.baseURL.slice(0, -1);
    }
  }

  async login(email, password) {
    try {
      // Ensure baseURL is set
      if (!this.baseURL) {
        throw new Error('Directus URL is not set');
      }

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          mode: 'cookie',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      if (data.data && data.data.access_token) {
        this.token = data.data.access_token;
        // Store the token and email in localStorage for persistence
        localStorage.setItem('directus_token', this.token);
        localStorage.setItem('directus_email', email);
        localStorage.setItem('directus_url', this.baseURL);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to connect to Directus server');
    }
  }

  async request(endpoint, options = {}) {
    // Get token from instance or localStorage
    const token = this.token || localStorage.getItem('directus_token');
    
    // If no token is available, throw an error
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Ensure baseURL is set
    if (!this.baseURL) {
      const savedUrl = localStorage.getItem('directus_url');
      if (savedUrl) {
        this.baseURL = savedUrl.endsWith('/') ? savedUrl.slice(0, -1) : savedUrl;
      } else {
        throw new Error('Directus URL is not set');
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Ensure we have the latest token
    this.token = token;

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }
}

// DirectusClient is now used directly with 'new' keyword

class DirectusGrapesJSBuilder {
  constructor() {
    // Initialize properties
    this.directus = null;
    this.currentUser = null;
    this.currentApp = null;
    this.editor = null;
    this.isAuthenticated = false;

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.checkSession = this.checkSession.bind(this);
    this.initializeDirectus = this.initializeDirectus.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.loadCurrentUser = this.loadCurrentUser.bind(this);
    this.showAuth = this.showAuth.bind(this);
    this.showApp = this.showApp.bind(this);
    this.showView = this.showView.bind(this);
    this.showNotification = this.showNotification.bind(this);
    this.loadUserApps = this.loadUserApps.bind(this);
    this.renderApps = this.renderApps.bind(this);
    this.showLoading = this.showLoading.bind(this);
    this.openApp = this.openApp.bind(this);
    this.initializeEditor = this.initializeEditor.bind(this);
    this.saveCurrentApp = this.saveCurrentApp.bind(this);
    this.deleteApp = this.deleteApp.bind(this);
    this.createNewApp = this.createNewApp.bind(this);
    this.setupAutoSave = this.setupAutoSave.bind(this);

    // Initialize the application
    this.initialize();
  }

  // Initialize the application
  async initialize() {
    // Check for existing session
    await this.checkSession();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  // Set up event listeners
  setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(loginForm);
        const email = formData.get('email');
        const password = formData.get('password');
        const url = formData.get('directus-url');
        
        if (email && password && url) {
          try {
            await this.login(email, password, url);
            // Clear password field after successful login
            loginForm.reset();
          } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Login failed. Please check your credentials and try again.', 'error');
            // Clear password field on error
            document.getElementById('password').value = '';
          }
        } else {
          this.showNotification('Please fill in all fields', 'error');
        }
      });
    }

    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('hidden');
        
        // Toggle between menu and close icon
        const icon = mobileMenuButton.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-bars');
          icon.classList.toggle('fa-times');
        }
      });
    }

    // User menu dropdown toggle
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');
    if (userMenuButton && userDropdownMenu) {
      userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = userMenuButton.getAttribute('aria-expanded') === 'true';
        userMenuButton.setAttribute('aria-expanded', !isExpanded);
        userDropdownMenu.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!userMenuButton.contains(e.target) && !userDropdownMenu.contains(e.target)) {
          userMenuButton.setAttribute('aria-expanded', 'false');
          userDropdownMenu.classList.add('hidden');
        }
      });
    }

    // Logout button (both desktop and mobile)
    const logoutButtons = [
      document.getElementById('logout-btn'),
      document.getElementById('mobile-logout-btn')
    ].filter(Boolean);

    logoutButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    });

    // New app button
    const newAppBtn = document.getElementById('new-app-btn');
    if (newAppBtn) {
      newAppBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.createNewApp();
      });
    }

    // Save app button
    const saveAppBtn = document.getElementById('save-app-btn');
    if (saveAppBtn) {
      saveAppBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveCurrentApp();
      });
    }

    // Navigation buttons (desktop and mobile)
    const setupNavigation = (prefix = '') => {
      const appsTab = document.getElementById(`${prefix}apps-tab`);
      const editorTab = document.getElementById(`${prefix}editor-tab`);
      const collectionsTab = document.getElementById(`${prefix}collections-tab`);
      const saveBtn = document.getElementById(`${prefix}save-btn`);

      if (appsTab) {
        appsTab.addEventListener('click', (e) => {
          e.preventDefault();
          this.showView('apps');
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenuButton.click();
          }
        });
      }
      
      if (editorTab) {
        editorTab.addEventListener('click', (e) => {
          e.preventDefault();
          this.showView('editor');
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenuButton.click();
          }
        });
      }
      
      if (collectionsTab) {
        collectionsTab.addEventListener('click', (e) => {
          e.preventDefault();
          this.showView('collections');
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenuButton.click();
          }
        });
      }
      
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.saveCurrentApp();
          // Close mobile menu if open
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenuButton.click();
          }
        });
      }
    };
    
    // Setup both desktop and mobile navigation
    setupNavigation();
    setupNavigation('mobile-');
    
    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (!mobileMenu.classList.contains('hidden')) {
          mobileMenuButton.click();
        }
      });
    });

    const showCollectionsBtn = document.getElementById('show-collections-btn');
    if (showCollectionsBtn) {
      showCollectionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showView('collections');
      });
    }
  }

  // Initialize mobile menu toggle
  setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
      mobileMenuButton.addEventListener('click', () => {
        const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
        mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('hidden');
    
    // Toggle between menu and close icon
    const icon = mobileMenuButton.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    }
  });
}

// User menu dropdown toggle
const userMenuButton = document.getElementById('user-menu-button');
const userDropdownMenu = document.getElementById('user-dropdown-menu');
if (userMenuButton && userDropdownMenu) {
  userMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = userMenuButton.getAttribute('aria-expanded') === 'true';
    userMenuButton.setAttribute('aria-expanded', !isExpanded);
    userDropdownMenu.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userMenuButton.contains(e.target) && !userDropdownMenu.contains(e.target)) {
      userMenuButton.setAttribute('aria-expanded', 'false');
      userDropdownMenu.classList.add('hidden');
    }
  });
}

// Logout button (both desktop and mobile)
const logoutButtons = [
  document.getElementById('logout-btn'),
  document.getElementById('mobile-logout-btn')
].filter(Boolean);

logoutButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    this.logout();
  });
});

// New app button
const newAppBtn = document.getElementById('new-app-btn');
if (newAppBtn) {
  newAppBtn.addEventListener('click', (e) => {
    e.preventDefault();
    this.createNewApp();
  });
}

// Save app button
const saveAppBtn = document.getElementById('save-app-btn');
if (saveAppBtn) {
  saveAppBtn.addEventListener('click', (e) => {
    e.preventDefault();
    this.saveCurrentApp();
  });
}

// Navigation buttons (desktop and mobile)
const setupNavigation = (prefix = '') => {
  const appsTab = document.getElementById(`${prefix}apps-tab`);
  const editorTab = document.getElementById(`${prefix}editor-tab`);
  const collectionsTab = document.getElementById(`${prefix}collections-tab`);
  const saveBtn = document.getElementById(`${prefix}save-btn`);

  if (appsTab) {
    appsTab.addEventListener('click', (e) => {
      e.preventDefault();
      this.showView('apps');
      // Close mobile menu if open
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenuButton.click();
      }
    });
  }
  
  if (editorTab) {
    editorTab.addEventListener('click', (e) => {
      e.preventDefault();
      this.showView('editor');
      // Close mobile menu if open
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenuButton.click();
      }
    });
  }
  
  if (collectionsTab) {
    collectionsTab.addEventListener('click', (e) => {
      e.preventDefault();
      this.showView('collections');
      // Close mobile menu if open
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenuButton.click();
      }
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.saveCurrentApp();
      // Close mobile menu if open
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        mobileMenuButton.click();
      }
    });
  }
};
  
// Setup both desktop and mobile navigation
setupNavigation();
setupNavigation('mobile-');
  
// Close mobile menu when clicking on a link
const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (!mobileMenu.classList.contains('hidden')) {
      mobileMenuButton.click();
    }
  });
});

const showCollectionsBtn = document.getElementById('show-collections-btn');
if (showCollectionsBtn) {
  showCollectionsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    this.showView('collections');
  });
}

}

// Check for existing session
async checkSession() {
try {
  const savedUrl = localStorage.getItem('directus_url');
  const savedToken = localStorage.getItem('directus_token');
  const savedEmail = localStorage.getItem('directus_email');
  const savedUserId = localStorage.getItem('directus_user_id');
  
  if (!savedUrl || !savedToken || !savedEmail) {
    this.showAuth();
    return false;
  }
  
  console.log('Checking existing session...');
  
  // Initialize Directus with saved token
  await this.initializeDirectus(savedUrl, savedEmail, savedToken);
  
  // Set current user from saved data
  this.currentUser = { id: savedUserId, email: savedEmail };
  
  // Test the connection by loading user data
  try {
    const userData = await this.loadCurrentUser();
    if (userData) {
      this.currentUser = userData;
      this.isAuthenticated = true;
      
      // Update stored user ID if needed
      if (userData.id && userData.id !== savedUserId) {
        localStorage.setItem('directus_user_id', userData.id);
      }
      
      console.log('Session valid, showing app...');
      this.showApp();
      
      // Load apps in the background
      this.loadUserApps().catch(err => {
        console.error('Background app load failed:', err);
      });
      
      return true;
    }
  } catch (userError) {
    console.error('Failed to load user data:', userError);
    // Continue to logout on error
  }
  
  // If we get here, the session is invalid
  console.log('Invalid session, logging out...');
  this.logout();
  return false;
  
} catch (error) {
  console.error('Session check failed:', error);
  this.showNotification('Session expired. Please log in again.', 'error');
  this.logout();
  return false;
}  
}

// Initialize Directus client
async initializeDirectus(url, email, token = null) {
try {
  // Ensure URL has the correct format
  const apiUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  
  console.log('Initializing Directus client with URL:', apiUrl);
  
  // Create Directus client with REST and authentication plugins
  this.directus = createDirectus(apiUrl)
    .with(rest({
      onRequest: (options) => {
        // Add auth token to all requests
        options.headers = options.headers || {};
        if (token) {
          options.headers['Authorization'] = `Bearer ${token}`;
        }
        options.headers['Accept'] = 'application/json';
        options.headers['Content-Type'] = 'application/json';
        return options;
      }
    }))
    .with(authentication('json'));
  
  // Store URL and token for direct API calls
  this.directus.url = apiUrl;
  
  if (token) {
    console.log('Setting up authentication with token');
    // Set the static token for authentication
    this.directus = this.directus.with(staticToken(token));
    this.directus.token = token; // Store token for direct API calls
    this.directus.setToken = (newToken) => {
      this.directus.token = newToken;
      // Update the static token plugin with the new token
      this.directus = this.directus.with(staticToken(newToken));
    };
    this.isAuthenticated = true;
  }
  
  return true;
} catch (error) {
  console.error('Failed to initialize Directus client:', error);
  throw new Error('Failed to connect to Directus server. Please check the URL and try again.');
}
}

// Test Directus API connection
async testDirectusConnection(url, token) {
try {
  console.log('Testing Directus API connection...');
  
  // Test server availability
  const serverInfo = await fetch(`${url}/server/info`);
  if (!serverInfo.ok) {
    throw new Error(`Server not available: ${serverInfo.status} ${serverInfo.statusText}`);
  }
  
  // Test authentication
  const authCheck = await fetch(`${url}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  
  if (!authCheck.ok) {
    const error = await authCheck.json().catch(() => ({}));
    console.error('Authentication failed:', {
      status: authCheck.status,
      statusText: authCheck.statusText,
      error
    });
    throw new Error(`Authentication failed: ${authCheck.status} ${authCheck.statusText}`);
  }
  
  const userData = await authCheck.json();
  console.log('Authentication successful, user data:', userData);
  return userData;
} catch (error) {
  console.error('Connection test failed:', error);
  throw error;
}
}

// Handle user login with direct fetch to bypass OTP
  async login(email = 'admin@example.com', password = '5a03ea6a', url = 'https://directus-oracle.panel.ballarihealth.com') {
    try {
      // Show loading state
      this.showLoading(true, 'Logging in...');
      
      console.log('Initializing Directus client...');
      
      // Ensure URL has the correct format
      const apiUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      const apiBaseUrl = `${apiUrl}/`;
      
      // First, check server info to verify API endpoint
      console.log('Checking server info...');
      const serverInfoUrl = new URL('server/info', apiBaseUrl).toString();
      console.log('Server info endpoint:', serverInfoUrl);
      
      const serverInfoResponse = await fetch(serverInfoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!serverInfoResponse.ok) {
        const errorText = await serverInfoResponse.text();
        console.error('Server info check failed:', {
          status: serverInfoResponse.status,
          statusText: serverInfoResponse.statusText,
          error: errorText
        });
        throw new Error(`Server not available: ${serverInfoResponse.status} ${serverInfoResponse.statusText}`);
      }
      
      const serverInfo = await serverInfoResponse.json();
      console.log('Server info:', serverInfo);
      
      // Attempt login with the correct API path
      console.log('Attempting login with email and password...');
      
      // Fix the double slash issue by ensuring clean URL concatenation
      const loginEndpoint = new URL('auth/login', apiBaseUrl).toString();
      console.log('Login endpoint:', loginEndpoint);
      
      const loginResponse = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          mode: 'json',
          otp: undefined // Explicitly set to undefined to avoid null/undefined issues
        })
      });
      
      if (!loginResponse.ok) {
        let errorText;
        try {
          errorText = await loginResponse.text();
          const errorData = errorText ? JSON.parse(errorText) : {};
          
          console.error('Login failed with response:', {
            status: loginResponse.status,
            statusText: loginResponse.statusText,
            url: loginResponse.url,
            headers: Object.fromEntries(loginResponse.headers.entries()),
            error: errorData
          });
          
          // Try to extract a meaningful error message
          let errorMessage = 'Login failed';
          if (errorData.errors && errorData.errors.length > 0) {
            errorMessage = errorData.errors.map(e => e.message).join('; ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorText) {
            errorMessage = `Server error: ${errorText.substring(0, 200)}`;
          }
          
          throw new Error(`${errorMessage} (${loginResponse.status} ${loginResponse.statusText})`);
        } catch (e) {
          console.error('Error processing login error response:', e, 'Raw response text:', errorText);
          throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
        }
      }
      
      const loginData = await loginResponse.json();
      const accessToken = loginData?.data?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token received from server');
      }
      
      console.log('Login successful, access token received');
      
      // Initialize Directus with the token
      await this.initializeDirectus(apiUrl, email, accessToken);
      
      // Store session data
      localStorage.setItem('directus_url', apiUrl);
      localStorage.setItem('directus_token', accessToken);
      localStorage.setItem('directus_email', email);
      
      // Set auth token for all future requests
      this.directus.setToken(accessToken);
      
      // Load user data
      await this.loadCurrentUser();
      
      // Show the app view
      this.showApp();
      
      return true;
    } catch (error) {
      console.error('Error during login:', error);
      this.showNotification(`Login failed: ${error.message}`, 'error');
      
      // Clear any stored credentials on error
      localStorage.removeItem('directus_token');
      localStorage.removeItem('directus_email');
      localStorage.removeItem('directus_url');
      
      throw error; // Re-throw to be handled by the caller
    }
  }

  // Update UI with current user info
  updateUserUI() {
    if (!this.currentUser) {
      console.warn('No current user data available for UI update');
      return;
    }
    
    console.log('Updating UI with user data:', this.currentUser);
    const email = this.currentUser.email || 'User';
    const firstName = this.currentUser.first_name || email.split('@')[0];
    
    // Update desktop user info
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
      userEmailElement.textContent = email;
    } else {
      console.warn('Could not find user-email element');
    }
    
    // Update desktop avatar
    const userAvatarElement = document.getElementById('user-avatar');
    if (userAvatarElement) {
      const initials = this.currentUser.first_name?.charAt(0) || 
                     this.currentUser.email?.charAt(0).toUpperCase() || 'U';
      userAvatarElement.textContent = initials;
      userAvatarElement.setAttribute('aria-label', `User menu for ${firstName}`);
    } else {
      console.warn('Could not find user-avatar element');
    }
    
    // Update mobile user info
    const mobileUserEmail = document.getElementById('mobile-user-email');
    if (mobileUserEmail) {
      mobileUserEmail.textContent = email;
    } else {
      console.warn('Could not find mobile-user-email element');
    }
    
    // Update mobile avatar
    const mobileUserAvatar = document.getElementById('mobile-user-avatar');
    if (mobileUserAvatar) {
      // If user has an avatar, use it, otherwise generate initials
      if (this.currentUser.avatar) {
        mobileUserAvatar.src = this.currentUser.avatar;
        mobileUserAvatar.alt = `${firstName}'s avatar`;
      } else {
        const initials = (this.currentUser.first_name?.charAt(0) || 
                        this.currentUser.email?.charAt(0).toUpperCase() || 'U') + 
                       (this.currentUser.last_name?.charAt(0) || '');
        mobileUserAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff`;
        mobileUserAvatar.alt = `${initials} avatar`;
      }
    } else {
      console.warn('Could not find mobile-user-avatar element');
    }
    
    // Update user menu button accessibility
    const userMenuButton = document.getElementById('user-menu-button');
    if (userMenuButton) {
      userMenuButton.setAttribute('aria-label', `User menu for ${firstName}`);
    } else {
      console.warn('Could not find user-menu-button element');
    }
  }
  
  // Logout the current user
  async logout() {
    try {
      // If we have a valid session, try to log out properly
      const token = localStorage.getItem('directus_token');
      const url = localStorage.getItem('directus_url');
      
      if (token && url) {
        try {
          // Attempt to revoke the token
          await fetch(`${url}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refresh_token: localStorage.getItem('directus_refresh_token') || undefined
            })
          });
        } catch (error) {
          console.warn('Error during token revocation:', error);
          // Continue with logout even if token revocation fails
        }
      }

      // Clear local storage
      localStorage.removeItem('directus_token');
      localStorage.removeItem('directus_refresh_token');
      localStorage.removeItem('directus_email');
      localStorage.removeItem('directus_url');
      
      // Reset mobile menu icon if it exists
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      if (mobileMenuButton) {
        const icon = mobileMenuButton.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-times');
          if (!icon.classList.contains('fa-bars')) {
            icon.classList.add('fa-bars');
          }
        }
      }
      
      // Reset user dropdown menu if open
      const userMenuButton = document.getElementById('user-menu-button');
      const userDropdownMenu = document.getElementById('user-dropdown-menu');
      if (userMenuButton && userDropdownMenu) {
        userMenuButton.setAttribute('aria-expanded', 'false');
        userDropdownMenu.classList.add('hidden');
      }
      
      // Reset mobile user info
      const mobileUserEmail = document.getElementById('mobile-user-email');
      if (mobileUserEmail) {
        mobileUserEmail.textContent = 'user@example.com';
      }
      
      const mobileUserAvatar = document.getElementById('mobile-user-avatar');
      if (mobileUserAvatar) {
        mobileUserAvatar.src = 'https://ui-avatars.com/api/?name=U&background=3b82f6&color=fff';
        mobileUserAvatar.alt = 'User avatar';
      }
      
      // Reset instance state
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentApp = null;
      
      // Show the login view
      this.showAuth();
      
      // Show a notification
      this.showNotification('Successfully logged out', 'success');
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      this.showNotification('Error during logout', 'error');
      return false;
    }
  }

  // Show authentication screen
  showAuth() {
    console.log('Showing auth screen');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app');
    const editorContainer = document.getElementById('editor-container');
    
    if (authContainer) {
      authContainer.classList.remove('hidden');
      authContainer.style.display = 'flex'; // Ensure flex display
    }
    if (appContainer) {
      appContainer.classList.add('hidden');
      appContainer.style.display = 'none';
    }
    if (editorContainer) {
      editorContainer.classList.add('hidden');
      editorContainer.style.display = 'none';
    }
    
    console.log('Auth container state:', {
      authContainer: authContainer ? 'found' : 'not found',
      appContainer: appContainer ? 'found' : 'not found',
      editorContainer: editorContainer ? 'found' : 'not found'
    });
  }

  // Update user interface with current user info
  updateUserUI() {
    if (!this.currentUser) {
      console.warn('No current user data available for UI update');
      return;
    }

    const firstName = this.currentUser.first_name || 'User';
    const email = this.currentUser.email || '';
    
    // Update desktop user info
    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userNameElement) userNameElement.textContent = firstName;
    if (userEmailElement) userEmailElement.textContent = email;
    if (userAvatar) {
      const initials = (this.currentUser.first_name?.charAt(0) || 
                       this.currentUser.email?.charAt(0).toUpperCase() || 'U') + 
                      (this.currentUser.last_name?.charAt(0) || '');
      userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff`;
      userAvatar.alt = `${initials} avatar`;
    }
    
    // Update mobile user info
    const mobileUserAvatar = document.getElementById('mobile-user-avatar');
    if (mobileUserAvatar) {
      const mobileInitials = (this.currentUser.first_name?.charAt(0) || 
                            this.currentUser.email?.charAt(0).toUpperCase() || 'U') + 
                           (this.currentUser.last_name?.charAt(0) || '');
      mobileUserAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mobileInitials)}&background=3b82f6&color=fff`;
      mobileUserAvatar.alt = `${mobileInitials} avatar`;
    } else {
      console.warn('Could not find mobile-user-avatar element');
    }
    
    // Update user menu button accessibility
    const userMenuButton = document.getElementById('user-menu-button');
    if (userMenuButton) {
      userMenuButton.setAttribute('aria-label', `User menu for ${firstName}`);
    } else {
      console.warn('Could not find user-menu-button element');
    }
  }

  // Show main application
  showApp() {
    console.log('Showing main application');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app');
    const editorContainer = document.getElementById('editor-container');
    
    console.log('Container states:', {
      authContainer: authContainer ? 'found' : 'not found',
      appContainer: appContainer ? 'found' : 'not found',
      editorContainer: editorContainer ? 'found' : 'not found'
    });
    
    // Update UI with user info
    this.updateUserUI();
    
    // Toggle container visibility
    if (authContainer) {
      authContainer.classList.add('hidden');
      authContainer.style.display = 'none';
    }
    
    if (appContainer) {
      appContainer.classList.remove('hidden');
      appContainer.style.display = 'block';
    }
    
    if (editorContainer) {
      editorContainer.classList.add('hidden');
      editorContainer.style.display = 'none';
    }
    
    // Show the apps view by default
    this.showView('apps');
    
    // Load user's apps
    this.loadUserApps().catch(error => {
      console.error('Error loading user apps:', error);
      this.showNotification('Failed to load your apps. Please try refreshing the page.', 'error');
    });
  }

  // Show a specific view
  showView(viewName) {
    console.log(`Showing view: ${viewName}`);
    
    // Hide all views first
    const views = ['apps-view', 'editor-view', 'collections-view'];
    views.forEach(view => {
      const element = document.getElementById(view);
      if (element) {
        element.classList.add('hidden');
      }
    });

    // Show the requested view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
      targetView.classList.remove('hidden');
    } else {
      console.warn(`Requested view not found: ${viewName}-view`);
    }
  }

  // Load user's apps from Directus
  async loadUserApps() {
    try {
      this.showLoading(true, 'Loading your apps...');
      
      // Get current user ID from localStorage if not available in memory
      if (!this.currentUser || !this.currentUser.id) {
        const userId = localStorage.getItem('directus_user_id');
        if (!userId) {
          throw new Error('User not authenticated');
        }
        this.currentUser = { id: userId };
      }
      
      console.log('Loading apps for user:', this.currentUser.id);
      
      try {
        // Use the Directus SDK to fetch apps
        const result = await this.directus.request(
          readItems('gjs_apps', {
            filter: {
              user_created: {
                _eq: this.currentUser.id
              }
            },
            fields: ['*']
          })
        );
        
        console.log('Apps loaded via SDK:', result);
        
        if (Array.isArray(result)) {
          this.renderApps(result);
          return result;
        }
        
        return [];
      } catch (error) {
      console.error('Error loading user apps:', error);
      // Don't show refresh message if it's an auth error
      if (error.message.includes('token') || error.message.includes('auth') || error.message.includes('401')) {
        this.showNotification('Session expired. Please log in again.', 'error');
        this.logout();
      } else {
        this.showNotification(`Failed to load your apps: ${error.message}`, 'error');
      }
      throw error;
    } finally {
      this.showLoading(false);
    }
  }

  // Show a notification to the user
  showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 transition-all duration-300 transform translate-x-full';
      document.body.appendChild(notification);
    }

    // Set notification content and styling based on type
    const typeClasses = {
      success: 'bg-green-100 border-green-500 text-green-700',
      error: 'bg-red-100 border-red-500 text-red-700',
      warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
      info: 'bg-blue-100 border-blue-500 text-blue-700'
    };

    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 transition-all duration-300 transform ${typeClasses[type] || typeClasses.info} border-l-4`;
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
          ${type === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
          ${type === 'warning' ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
          ${!['success', 'error', 'warning'].includes(type) ? '<i class="fas fa-info-circle"></i>' : ''}
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
            <span class="sr-only">Close</span>
            <i class="h-5 w-5 fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    // Show notification
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    }, 10);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      }, 5000);

    // Close button functionality
    const closeButton = notification.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        notification.classList.add('translate-x-full');
      });
    }
  }

  // Render apps in the UI
  renderApps(apps) {
    const appList = document.getElementById('app-list');
    if (!appList) return;
    
    if (apps.length === 0) {
      appList.innerHTML = `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8">
          <i class="fas fa-folder-open text-4xl text-gray-300 mb-2"></i>
          <p class="text-gray-500">No apps found. Create your first app to get started.</p>
        </div>
      `;
      return;
    }
    
    appList.innerHTML = apps.map(app => `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div class="p-4">
          <h3 class="font-medium text-gray-900">${app.name || 'Untitled App'}</h3>
          <p class="text-sm text-gray-500 mt-1">
            Updated: ${new Date(app.date_updated).toLocaleDateString()}
          </p>
        </div>
        <div class="bg-gray-50 px-4 py-3 flex justify-end space-x-2">
          <button class="text-sm text-blue-600 hover:text-blue-800" 
                  onclick="app.openApp('${app.id}')">
            Open
          </button>
          <button class="text-sm text-red-600 hover:text-red-800" 
                  onclick="app.deleteApp('${app.id}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  // Show/hide loading state with an optional message
  showLoading(show, message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingOverlay) {
      if (show) {
        // Update loading message if provided
        if (loadingMessage && message) {
          loadingMessage.textContent = message;
        }
        loadingOverlay.classList.remove('hidden');
      } else {
        loadingOverlay.classList.add('hidden');
      }
    }
    
    // Toggle body scroll based on loading state
    document.body.style.overflow = show ? 'hidden' : '';
  }

  // Open an app in the editor
  async openApp(appId) {
    if (!appId) {
      console.error('No app ID provided');
      return false;
    }
    
    try {
      if (!this.directus) {
        throw new Error('Not authenticated');
      }
      
      this.showLoading(true, 'Loading app...');
      
      // Fetch the app data using Directus SDK query
      const response = await this.directus.request(
        readItems('builder_apps', {
          filter: {
            id: { _eq: appId }
          },
          limit: 1
        })
      );
      
      if (!response || response.length === 0) {
        throw new Error('App not found');
      }
      
      const appData = response[0];
      
      // Parse the layout data if it's a string
      let layout = response.layout;
      if (typeof layout === 'string') {
        try {
          layout = JSON.parse(layout);
        } catch (error) {
          console.warn('Failed to parse layout data, using default layout');
          layout = {
            components: '<div class="container"><h1>New App</h1><p>Start building your content here.</p></div>',
            styles: '.container { max-width: 1200px; margin: 0 auto; padding: 20px; }'
          };
        }
      }
      
      // Ensure layout has required properties
      if (!layout.components) {
        layout.components = '<div class="container"><h1>New App</h1><p>Start building your content here.</p></div>';
      }
      if (!layout.styles) {
        layout.styles = '.container { max-width: 1200px; margin: 0 auto; padding: 20px; }';
      }
      
      // Update the current app
      this.currentApp = {
        ...appData,
        layout
      };
      
      // Show the editor view
      this.showView('editor');
      
      // Initialize the editor with the app's layout
      this.initializeEditor(layout);
      
      return true;
      
    } catch (error) {
      console.error('Failed to open app:', error);
      this.showNotification(
        error.response?.data?.message || 'Failed to open app. Please try again.',
        'error'
      );
      this.showView('apps');
      return false;
    } finally {
      this.showLoading(false);
    }
  }

  // Initialize the GrapesJS editor
  initializeEditor(layout = { components: '', styles: '' }) {
    try {
      // Show loading state
      this.showLoading(true, 'Initializing editor...');
      
      // Initialize GrapesJS editor
      this.editor = grapesjs.init({
        container: '#gjs',
        fromElement: true,
        height: '100vh',
        height: '100%',
        width: 'auto',
        storageManager: false, // We handle saving manually
        noticeOnUnload: false,
        autorender: true,
        forceClass: false,
        showOffsets: true,
        showDevices: true,
        showToolbar: true,
        layerManager: {
          appendTo: '.layers-container',
        },
        selectorManager: {
          componentFirst: true,
        },
        deviceManager: {
          devices: [
            {
              id: 'desktop',
              name: 'Desktop',
              width: '',
              widthMedia: '100%',
            },
            {
              id: 'tablet',
              name: 'Tablet',
              width: '768px',
              widthMedia: '768px',
            },
            {
              id: 'mobile',
              name: 'Mobile',
              width: '375px',
              widthMedia: '375px',
            },
          ],
        },
        plugins: [
          'gjs-preset-webpage', // Basic webpage components
          'gjs-blocks-basic',   // Basic blocks
          'grapesjs-plugin-forms', // Form elements
          'grapesjs-component-code-editor', // Code editor
          'grapesjs-touch',     // Touch support
          'grapesjs-style-bg',  // Background styles
          'grapesjs-tooltip',   // Tooltips
          'grapesjs-tabs',      // Tabs component
          'grapesjs-custom-code', // Custom code
          'grapesjs-navbar',    // Navbar component
          'grapesjs-component-countdown', // Countdown component
          'grapesjs-typed',     // Typed.js integration
        ],
        pluginsOpts: {
          'gjs-blocks-basic': {},
          'gjs-preset-webpage': {
            modalImportTitle: 'Import Template',
            modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste your HTML/CSS and click Import</div>',
            modalImportContent: function(editor) {
              return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
            },
          },
          'grapesjs-tabs': {},
          'grapesjs-custom-code': {},
          'grapesjs-navbar': {},
          'grapesjs-component-countdown': {},
          'grapesjs-typed': {},
          'grapesjs-style-bg': {},
        },
        canvas: {
          styles: [
            'https://unpkg.com/tailwindcss@^2.0.1/dist/tailwind.min.css',
          ],
          scripts: [],
        },
        styleManager: {
          sectors: [{
            name: 'Dimension',
            open: false,
            buildProps: ['width', 'min-height', 'padding'],
            properties: [{
              type: 'integer',
              name: 'The width',
              property: 'width',
              units: ['px', '%'],
              defaults: 'auto',
              min: 0,
            }]
          }]
        },
        blockManager: {
          appendTo: '#blocks',
          blocks: [
            {
              id: 'section',
              label: '<b>Section</b>',
              attributes: { class: 'gjs-block-section' },
              content: `<section>
                <h1>This is a simple title</h1>
                <div>This is just a Lorem text: Lorem ipsum dolor sit amet</div>
              </section>`,
            },
            {
              id: 'text',
              label: 'Text',
              content: '<div data-gjs-type="text">Insert your text here</div>',
            },
            {
              id: 'image',
              label: 'Image',
              content: { type: 'image' },
              activate: true,
            }
          ]
        },
        layerManager: {
          appendTo: '.layers-container'
        },
        panels: {
          defaults: [
            {
              id: 'panel-devices',
              el: '.panel__devices',
              buttons: [{
                id: 'device-desktop',
                label: 'Desktop',
                command: 'set-device-desktop',
                className: 'fa fa-desktop',
                active: true,
              }, {
                id: 'device-tablet',
                label: 'Tablet',
                command: 'set-device-tablet',
                className: 'fa fa-tablet',
              }, {
                id: 'device-mobile',
                label: 'Mobile',
                command: 'set-device-mobile',
                className: 'fa fa-mobile',
              }]
            },
            {
              id: 'panel-actions',
              el: '.panel__actions',
              buttons: [{
                id: 'save',
                className: 'fa fa-save',
                command: 'save',
                attributes: { title: 'Save' },
              }, {
                id: 'preview',
                className: 'fa fa-eye',
                command: 'preview',
                attributes: { title: 'Preview' },
              }]
            }
          ]
        },
      });
      
      // Add custom commands
      this.editor.Commands.add('save', {
        run: (editor, sender) => {
          sender && sender.set('active', false);
          this.saveCurrentApp();
        },
      });
      
      this.editor.Commands.add('preview', {
        run: (editor, sender) => {
          sender && sender.set('active', false);
          const previewUrl = window.URL.createObjectURL(
            new Blob([editor.getHtml()], { type: 'text/html' })
          );
          window.open(previewUrl, '_blank');
        },
      });
      
      // Load the layout if provided
      if (layout) {
        try {
          if (layout.components) {
            this.editor.setComponents(layout.components);
          }
          if (layout.styles) {
            this.editor.setStyle(layout.styles);
          }
        } catch (error) {
          console.error('Error loading layout:', error);
          // Load default content if there's an error
          this.editor.setComponents('<div class="container"><h1>Welcome to your new app!</h1><p>Start building your content here.</p></div>');
          this.editor.setStyle('.container { max-width: 1200px; margin: 0 auto; padding: 20px; }');
        }
      } else {
        // Set default content if no layout is provided
        this.editor.setComponents('<div class="container"><h1>Welcome to your new app!</h1><p>Start building your content here.</p></div>');
        this.editor.setStyle('.container { max-width: 1200px; margin: 0 auto; padding: 20px; }');
      }
      
      // Set up auto-save
      this.setupAutoSave();
      
      // Hide loading when editor is ready
      this.editor.on('load', () => {
        this.showLoading(false);
      });
      
      return this.editor;
      
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      this.showNotification('Failed to initialize editor', 'error');
      this.showLoading(false);
      return null;
    }
  }
  
  // Save the current app
  async saveCurrentApp() {
    if (!this.currentApp || !this.editor) {
      this.showNotification('No active app to save', 'warning');
      return false;
    }
    
    try {
      this.showLoading(true, 'Saving app...');
      
      // Get the current editor content
      const components = this.editor.getComponents();
      const styles = this.editor.getStyle();
      
      // Prepare the update data
      const updates = {
        layout: JSON.stringify({
          components,
          styles
        }),
        date_updated: new Date().toISOString()
      };
      
      // Update the app in Directus using the new SDK
      let response;
      if (this.currentApp.id) {
        // Update existing app
        response = await this.directus.request(
          updateItem('builder_apps', this.currentApp.id, updates)
        );
      } else {
        // Create new app
        response = await this.directus.request(
          createItem('builder_apps', {
            ...updates,
            name: 'New App',
            user_created: this.currentUser.id,
            date_created: new Date().toISOString()
          })
        );
        this.currentApp.id = response.id;
      }
      
      // Update the current app data
      this.currentApp = {
        ...this.currentApp,
        ...updates,
        layout: { components, styles },
        ...(response.id && { id: response.id })
      };
      
      this.showNotification('App saved successfully', 'success');
      return true;
      
    } catch (error) {
      console.error('Failed to save app:', error);
      this.showNotification(
        error.message || 'Failed to save app. Please try again.', 
        'error'
      );
      return false;
    } finally {
      this.showLoading(false);
    }
  }
  
  // Set up auto-save functionality
  setupAutoSave() {
    if (!this.editor) return;
    
    // Auto-save every 30 seconds if there are changes
    let saveTimeout;
    let lastSavedContent = '';
    
    const autoSave = () => {
      if (!this.editor || !this.currentApp) return;
      
      const currentContent = JSON.stringify({
        components: this.editor.getComponents(),
        styles: this.editor.getStyle()
      });
      
      // Only save if content has changed
      if (currentContent !== lastSavedContent) {
        this.saveCurrentApp().then(success => {
          if (success) {
            lastSavedContent = currentContent;
          }
        });
      }
    };
    
    // Listen for changes in the editor
    this.editor.on('change:changesCount', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(autoSave, 30000); // 30 seconds after last change
    });
    
    // Also save when window is about to unload
    window.addEventListener('beforeunload', (e) => {
      if (this.editor && this.currentApp) {
        const currentContent = JSON.stringify({
          components: this.editor.getComponents(),
          styles: this.editor.getStyle()
        });
        
        if (currentContent !== lastSavedContent) {
          // Show a warning if there are unsaved changes
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return e.returnValue;
        }
      }
    });
  }

  // Delete an app
  async deleteApp(appId) {
    if (!appId) {
      console.error('No app ID provided for deletion');
      return false;
    }
    
    if (!confirm('Are you sure you want to delete this app? This action cannot be undone.')) {
      return false;
    }
    
    try {
      this.showLoading(true, 'Deleting app...');
      
      // Delete the app from Directus using the new SDK
      await this.directus.request(
        deleteItem('builder_apps', appId)
      );
      
      // If the deleted app is the current app, clear the editor
      if (this.currentApp && this.currentApp.id === appId) {
        this.currentApp = null;
        if (this.editor) {
          this.editor.destroy();
          this.editor = null;
        }
      }
      
      // Reload the apps list
      await this.loadUserApps();
      
      this.showNotification('App deleted successfully', 'success');
      return true;
      if (this.currentApp && this.currentApp.id === appId) {
        this.currentApp = null;
        if (this.editor) {
          try {
            this.editor.destroy();
          } catch (error) {
            console.warn('Error destroying editor:', error);
          }
          this.editor = null;
        }
        this.showView('apps');
      }
      
      // Reload apps list
      await this.loadUserApps();
      this.showNotification('App deleted successfully', 'success');
      return true;
      
    } catch (error) {
      console.error('Failed to delete app:', error);
      this.showNotification(
        error.response?.data?.message || 'Failed to delete app. Please try again.',
        'error'
      );
      return false;
    } finally {
      this.showLoading(false);
    }
  }

  // Create a new app
  async createNewApp() {
    try {
      console.log('Starting app creation process...');
      
      if (!this.directus) {
        throw new Error('Not authenticated with Directus. Please log in first.');
      }
      
      if (!this.currentUser || !this.currentUser.id) {
        throw new Error('User information not available. Please log in again.');
      }
      
      const name = prompt('Enter a name for your new app:', 'My New App');
      if (!name) {
        console.log('App creation cancelled by user');
        return null;
      }
      
      console.log(`Creating new app with name: ${name}`);
      this.showLoading(true, 'Creating new app...');
      
      // Default content for the new app
      const defaultContent = {
        components: `
          <div class="container">
            <header class="bg-blue-600 text-white p-4">
              <h1 class="text-2xl font-bold">Your App Header</h1>
            </header>
            <main class="container mx-auto p-4">
              <h1 class="text-3xl font-bold mb-4">Welcome to your new app!</h1>
              <p class="mb-4">Start building your content here...</p>
              <div data-gjs-type="text">
                <p>This is a text component. Double click to edit me.</p>
              </div>
            </main>
          </div>
        `,
        styles: `
          .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          h1 { 
            color: #333; 
          }
          main {
            flex: 1;
          }
        `,
        // No default blocks to prevent duplication
        blocks: []
      };
      
      // Create the new app in Directus
      const newAppData = {
        name,
        description: `A new app created by ${this.currentUser.email || 'user'} on ${new Date().toLocaleDateString()}`,
        user_created: this.currentUser.id,
        layout: JSON.stringify(defaultContent),
        status: 'draft',
        date_created: new Date().toISOString(),
        date_updated: new Date().toISOString(),
        // Add metadata for better organization
        metadata: {
          version: '1.0.0',
          framework: 'grapesjs',
          created_by: this.currentUser.id,
          last_modified: new Date().toISOString()
        }
      };
      
      console.log('Sending app creation request with data:', newAppData);
      
      // Use the Directus SDK to create the new app
      const response = await this.directus.request(
        createItem('builder_apps', newAppData)
      );
      
      console.log('App creation response:', response);
      
      if (!response || !response.id) {
        throw new Error('Failed to create app: Invalid response from server');
      }
      
      // Update the current app data
      this.currentApp = {
        id: response.id,
        name: response.name || name,
        layout: defaultContent,
        date_created: response.date_created || new Date().toISOString(),
        date_updated: response.date_updated || new Date().toISOString()
      };
      
      // Refresh the apps list
      await this.loadUserApps();
      
      // Open the new app in the editor
      console.log(`Opening new app with ID: ${response.id}`);
      await this.openApp(response.id);
      
      this.showNotification('App created successfully!', 'success');
      return this.currentApp;
      
    } catch (error) {
      console.error('Error during app creation:', error);
      let errorMessage = 'Failed to create app. Please try again.';
      
      if (error.response) {
        // Handle HTTP error responses
        try {
          const errorData = await error.response.json();
          errorMessage = errorData.message || errorMessage;
          console.error('Error response:', errorData);
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      this.showNotification(errorMessage, 'error');
      return null;
    } finally {
      this.showLoading(false);
    }
  }
}

// Export the DirectusGrapesJSBuilder class
export { DirectusGrapesJSBuilder };

export default DirectusGrapesJSBuilder;
