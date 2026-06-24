/**
 * Client-Side Authentication Utilities
 */

// Native SHA-256 Hashing using Web Crypto API
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert Buffer to Hex String
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Retrieve the current user registry from localStorage
function getUserRegistry() {
    const registry = localStorage.getItem('oasis_auth_registry');
    return registry ? JSON.parse(registry) : [];
}

// Save a new user to the registry
function registerUser(username, passwordHash) {
    const registry = getUserRegistry();
    registry.push({
        username: username.toLowerCase().trim(),
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('oasis_auth_registry', JSON.stringify(registry));
}

// Check if username/email already exists
function isUsernameTaken(username) {
    const registry = getUserRegistry();
    const cleanUsername = username.toLowerCase().trim();
    return registry.some(user => user.username === cleanUsername);
}

// Password rules evaluator (min 8 chars, at least 1 digit)
function evaluatePasswordStrength(password) {
    const minLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    return {
        isValid: minLength && hasNumber,
        minLengthOk: minLength,
        hasNumberOk: hasNumber
    };
}

// Session Management (sessionStorage)
function createSession(username) {
    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessionData = {
        username: username.trim(),
        token: sessionToken,
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    sessionStorage.setItem('oasis_auth_session', JSON.stringify(sessionData));
    return sessionData;
}

function clearSession() {
    sessionStorage.removeItem('oasis_auth_session');
}

function getActiveSession() {
    const session = sessionStorage.getItem('oasis_auth_session');
    return session ? JSON.parse(session) : null;
}
