/**
 * Client-Side Authentication Utilities
 * Handles hashing, user registry operations, and session management.
 */

// ─── SHA-256 Hashing via native Web Crypto API ───────────────────────────────
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// ─── User Registry (localStorage mock database) ──────────────────────────────
function getUserRegistry() {
    const stored = localStorage.getItem('oasis_auth_registry');
    return stored ? JSON.parse(stored) : [];
}

/**
 * Save a new user profile to the registry.
 * Stores: name, phone, email, passwordHash, createdAt
 */
function registerUser(name, phone, email, passwordHash) {
    const registry = getUserRegistry();
    registry.push({
        name: name.trim(),
        phone: phone.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('oasis_auth_registry', JSON.stringify(registry));
}

/**
 * Check if an email address is already registered.
 */
function isEmailTaken(email) {
    const registry = getUserRegistry();
    return registry.some(user => user.email === email.toLowerCase().trim());
}

/**
 * Check if a phone number is already registered.
 */
function isPhoneTaken(phone) {
    const registry = getUserRegistry();
    return registry.some(user => user.phone === phone.trim());
}

/**
 * Find a user by email OR phone number (used during login).
 * Returns the matched user object or null.
 */
function findUserByIdentifier(identifier) {
    const registry = getUserRegistry();
    const clean = identifier.toLowerCase().trim();
    return registry.find(user =>
        user.email === clean || user.phone === identifier.trim()
    ) || null;
}

// ─── Password Validation Rules ────────────────────────────────────────────────
function evaluatePasswordStrength(password) {
    const minLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    return {
        isValid: minLength && hasNumber,
        minLengthOk: minLength,
        hasNumberOk: hasNumber
    };
}

// Validates that a phone number contains only digits and is 7–15 characters
function isValidPhone(phone) {
    return /^[0-9]{7,15}$/.test(phone.trim());
}

// Basic email format check
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Session Management (sessionStorage) ─────────────────────────────────────
function createSession(user) {
    const sessionToken = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const sessionData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
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
