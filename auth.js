/**
 * Authentication utility for private content
 * Handles token verification and access control
 */

const AUTH_STORAGE_KEY = 'website_auth_token';
const AUTH_EXPIRY_KEY = 'website_auth_expiry';
const TOKEN_EXPIRY_HOURS = 24; // Token expires after 24 hours

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
  
  if (!token || !expiry) {
    return false;
  }
  
  // Check if token has expired
  if (Date.now() > parseInt(expiry)) {
    clearAuth();
    return false;
  }
  
  return true;
}

/**
 * Save authentication token
 */
function saveAuth(token) {
  const expiry = Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  localStorage.setItem(AUTH_EXPIRY_KEY, expiry.toString());
}

/**
 * Clear authentication
 */
function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_EXPIRY_KEY);
}

/**
 * Get current token
 */
function getToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

/**
 * Verify token with server
 */
async function verifyToken(token) {
  try {
    const response = await fetch('/api/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: token })
    });
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

/**
 * Authenticate with token
 */
async function authenticate(token) {
  const isValid = await verifyToken(token);
  
  if (isValid) {
    saveAuth(token);
    return true;
  }
  
  return false;
}

/**
 * Protect content - show/hide based on authentication
 */
function protectContent(protectedElementId, loginFormId) {
  const protectedElement = document.getElementById(protectedElementId);
  const loginForm = document.getElementById(loginFormId);
  
  if (!protectedElement || !loginForm) {
    return;
  }
  
  if (isAuthenticated()) {
    protectedElement.style.display = 'block';
    loginForm.style.display = 'none';
  } else {
    protectedElement.style.display = 'none';
    loginForm.style.display = 'block';
  }
}

/**
 * Redirect if not authenticated
 */
function requireAuth(redirectUrl = 'login.html') {
  if (!isAuthenticated()) {
    window.location.href = redirectUrl;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isAuthenticated,
    saveAuth,
    clearAuth,
    getToken,
    verifyToken,
    authenticate,
    protectContent,
    requireAuth
  };
}

