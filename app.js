/**
 * Page Controllers and Form Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================================================
    // 1. REGISTRATION PAGE CONTROLLER
    // ==========================================================================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const usernameInput = document.getElementById('reg-username');
        const passwordInput = document.getElementById('reg-password');
        const reqLength = document.getElementById('req-length');
        const reqNumber = document.getElementById('req-number');
        const alertMessage = document.getElementById('reg-message');

        // Real-time password feedback
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = evaluatePasswordStrength(password);

            // Length Validation Indicator
            if (strength.minLengthOk) {
                reqLength.className = 'req-item valid';
                reqLength.querySelector('.bullet').textContent = '✔';
            } else {
                reqLength.className = 'req-item invalid';
                reqLength.querySelector('.bullet').textContent = '✖';
            }

            // Number Validation Indicator
            if (strength.hasNumberOk) {
                reqNumber.className = 'req-item valid';
                reqNumber.querySelector('.bullet').textContent = '✔';
            } else {
                reqNumber.className = 'req-item invalid';
                reqNumber.querySelector('.bullet').textContent = '✖';
            }
        });

        // Form Submit Handler
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Clear alert states
            showAlert(alertMessage, '', 'hidden');

            // 1. Empty field checks
            if (!username || !password) {
                showAlert(alertMessage, 'Please fill in all required fields.', 'error');
                return;
            }

            // 2. Strength Validation
            const strength = evaluatePasswordStrength(password);
            if (!strength.isValid) {
                showAlert(alertMessage, 'Password does not meet the security requirements.', 'error');
                return;
            }

            // 3. Username uniqueness check
            if (isUsernameTaken(username)) {
                showAlert(alertMessage, 'This username or email is already registered.', 'error');
                return;
            }

            // Disable button during registration process
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering...';

            try {
                // 4. Hash password client-side using SHA-256 (via Web Crypto)
                const hashed = await hashPassword(password);
                
                // 5. Store in Registry database mockup
                registerUser(username, hashed);

                showAlert(alertMessage, 'Registration successful! Redirecting to login...', 'success');

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);

            } catch (err) {
                showAlert(alertMessage, 'An unexpected error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register Account';
            }
        });
    }

    // ==========================================================================
    // 2. LOGIN PAGE CONTROLLER
    // ==========================================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const alertMessage = document.getElementById('login-message');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            showAlert(alertMessage, '', 'hidden');

            // 1. Empty field check
            if (!username || !password) {
                showAlert(alertMessage, 'Please enter both username and password.', 'error');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Validating...';

            try {
                // 2. Hash input password to match stored hash
                const hashedInput = await hashPassword(password);
                
                // 3. Authenticate against stored profiles
                const registry = getUserRegistry();
                const matchedUser = registry.find(user => 
                    user.username === username.toLowerCase().trim() && 
                    user.passwordHash === hashedInput
                );

                if (matchedUser) {
                    // Session registration
                    createSession(matchedUser.username);
                    window.location.href = 'dashboard.html';
                } else {
                    // CRITICAL: Display a generic message to prevent account enumeration
                    showAlert(alertMessage, 'Incorrect username or password.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login Securely';
                }

            } catch (err) {
                showAlert(alertMessage, 'An error occurred during authentication.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login Securely';
            }
        });
    }

    // ==========================================================================
    // 3. DASHBOARD PAGE CONTROLLER (PROTECTED VIEW)
    // ==========================================================================
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        const session = getActiveSession();

        // Redirect if session is missing
        if (!session) {
            window.location.replace('login.html');
            return;
        }

        // Set User details
        document.getElementById('session-username').textContent = session.username;

        // Set Profiles registered count stat
        const registry = getUserRegistry();
        document.getElementById('profile-count').textContent = `${registry.length} Profile${registry.length === 1 ? '' : 's'}`;

        // Dynamic Logs timestamp updating
        const loginTime = session.loginTime;
        document.getElementById('log-time-1').textContent = loginTime;
        
        // Mock timestamps preceding current login
        const [hourStr, minStrPart] = loginTime.split(':');
        const [minStr, ampm] = minStrPart.split(' ');
        let h = parseInt(hourStr);
        let m = parseInt(minStr);
        
        const formatTime = (hour, min) => {
            const padM = min.toString().padStart(2, '0');
            return `${hour}:${padM} ${ampm}`;
        };

        // Subtract minutes to create a realistic log history leading up to login
        const m2 = (m - 1 + 60) % 60;
        const h2 = m - 1 < 0 ? (h - 1 === 0 ? 12 : h - 1) : h;
        document.getElementById('log-time-2').textContent = formatTime(h2, m2);

        const m3 = (m - 2 + 60) % 60;
        const h3 = m - 2 < 0 ? (h - 1 === 0 ? 12 : h - 1) : h;
        document.getElementById('log-time-3').textContent = formatTime(h3, m3);

        // Logout Event
        logoutBtn.addEventListener('click', () => {
            clearSession();
            window.location.replace('login.html');
        });
    }

    // Alert helper function
    function showAlert(element, text, type) {
        element.className = 'alert-message';
        if (type === 'hidden') {
            element.classList.add('hidden');
            element.textContent = '';
        } else {
            element.classList.add(type);
            element.textContent = text;
        }
    }
});
