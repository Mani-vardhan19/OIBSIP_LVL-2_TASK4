/**
 * Page Controllers and Form Handlers
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // TAB SWITCHER (Login ↔ Sign Up)
    // =========================================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    const tabIndicator = document.querySelector('.tab-indicator');

    function switchTab(targetTab) {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === targetTab);
        });
        panels.forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `panel-${targetTab}`);
        });
        // Slide indicator to the active tab button
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
        if (activeBtn && tabIndicator) {
            tabIndicator.style.width = activeBtn.offsetWidth + 'px';
            tabIndicator.style.left  = activeBtn.offsetLeft + 'px';
        }
        // Clear messages when switching tabs
        document.querySelectorAll('.alert-message').forEach(el => {
            el.className = 'alert-message hidden';
            el.textContent = '';
        });
    }

    // Attach tab button listeners
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // "Switch" inline links inside panels
    document.querySelectorAll('.switch-link').forEach(link => {
        link.addEventListener('click', () => switchTab(link.dataset.targetTab));
    });

    // Init indicator position on load
    switchTab('login');

    // =========================================================================
    // PASSWORD VISIBILITY TOGGLES
    // =========================================================================
    document.querySelectorAll('.toggle-pass').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            input.type = input.type === 'password' ? 'text' : 'password';
            btn.classList.toggle('active');
        });
    });

    // =========================================================================
    // 1. LOGIN FORM CONTROLLER
    // =========================================================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const identifierInput = document.getElementById('login-identifier');
        const passwordInput   = document.getElementById('login-password');
        const alertMsg        = document.getElementById('login-message');
        const submitBtn       = document.getElementById('login-submit-btn');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAlert(alertMsg, '', 'hidden');

            const identifier = identifierInput.value.trim();
            const password   = passwordInput.value;

            // Empty field check
            if (!identifier || !password) {
                showAlert(alertMsg, 'Please fill in all fields.', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';

            try {
                const hashedInput = await hashPassword(password);
                const matchedUser = findUserByIdentifier(identifier);

                if (matchedUser && matchedUser.passwordHash === hashedInput) {
                    createSession(matchedUser);
                    window.location.href = 'dashboard.html';
                } else {
                    // Generic message — do not reveal which field is wrong
                    showAlert(alertMsg, 'Incorrect email / phone or password.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login Securely';
                }
            } catch (err) {
                showAlert(alertMsg, 'An error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login Securely';
            }
        });
    }

    // =========================================================================
    // 2. SIGN UP FORM CONTROLLER
    // =========================================================================
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const nameInput     = document.getElementById('signup-name');
        const phoneInput    = document.getElementById('signup-phone');
        const emailInput    = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const confirmInput  = document.getElementById('signup-confirm');
        const alertMsg      = document.getElementById('signup-message');
        const submitBtn     = document.getElementById('signup-submit-btn');

        const reqLength = document.getElementById('req-length');
        const reqNumber = document.getElementById('req-number');
        const reqMatch  = document.getElementById('req-match');

        // Live password feedback
        function updateRequirements() {
            const pass    = passwordInput.value;
            const confirm = confirmInput.value;
            const str     = evaluatePasswordStrength(pass);

            setReq(reqLength, str.minLengthOk);
            setReq(reqNumber, str.hasNumberOk);
            setReq(reqMatch,  pass !== '' && pass === confirm);
        }

        passwordInput.addEventListener('input', updateRequirements);
        confirmInput.addEventListener('input', updateRequirements);

        // Form submission
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showAlert(alertMsg, '', 'hidden');

            const name     = nameInput.value.trim();
            const phone    = phoneInput.value.trim();
            const email    = emailInput.value.trim();
            const password = passwordInput.value;
            const confirm  = confirmInput.value;

            // ── Validation chain ──────────────────────────────────────────
            if (!name || !phone || !email || !password || !confirm) {
                showAlert(alertMsg, 'Please fill in all required fields.', 'error');
                return;
            }

            if (!isValidPhone(phone)) {
                showAlert(alertMsg, 'Enter a valid phone number (digits only, 7–15 chars).', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert(alertMsg, 'Enter a valid email address.', 'error');
                return;
            }

            const strength = evaluatePasswordStrength(password);
            if (!strength.isValid) {
                showAlert(alertMsg, 'Password must be at least 8 characters and include a number.', 'error');
                return;
            }

            if (password !== confirm) {
                showAlert(alertMsg, 'Passwords do not match.', 'error');
                return;
            }

            if (isEmailTaken(email)) {
                showAlert(alertMsg, 'This email address is already registered.', 'error');
                return;
            }

            if (isPhoneTaken(phone)) {
                showAlert(alertMsg, 'This phone number is already registered.', 'error');
                return;
            }

            // ── Register ──────────────────────────────────────────────────
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';

            try {
                const hashed = await hashPassword(password);
                registerUser(name, phone, email, hashed);

                showAlert(alertMsg, `Account created! Welcome, ${name}. Redirecting to login...`, 'success');
                signupForm.reset();
                updateRequirements();

                setTimeout(() => switchTab('login'), 2000);

            } catch (err) {
                showAlert(alertMsg, 'An unexpected error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Account';
            } finally {
                // Re-enable after redirect timeout so it doesn't stay stuck if user navigates back
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Account';
                }, 2100);
            }
        });
    }

    // =========================================================================
    // 3. DASHBOARD CONTROLLER (PROTECTED VIEW)
    // =========================================================================
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        const session = getActiveSession();

        if (!session) {
            window.location.replace('login.html');
            return;
        }

        // Show user display name (name preferred, fall back to email)
        const displayName = session.name || session.email || 'User';
        document.getElementById('session-username').textContent = displayName;

        // Stats
        const registry = getUserRegistry();
        document.getElementById('profile-count').textContent =
            `${registry.length} Profile${registry.length === 1 ? '' : 's'}`;

        // Activity log timestamps
        const loginTime = session.loginTime;
        document.getElementById('log-time-1').textContent = loginTime;

        const [hourStr, minStrPart] = loginTime.split(':');
        const [minStr, ampm] = minStrPart.split(' ');
        let h = parseInt(hourStr);
        let m = parseInt(minStr);

        const formatTime = (hour, min) => `${hour}:${min.toString().padStart(2, '0')} ${ampm}`;

        const m2 = (m - 1 + 60) % 60;
        const h2 = (m - 1 < 0) ? (h - 1 === 0 ? 12 : h - 1) : h;
        document.getElementById('log-time-2').textContent = formatTime(h2, m2);

        const m3 = (m - 2 + 60) % 60;
        const h3 = (m - 2 < 0) ? (h - 1 === 0 ? 12 : h - 1) : h;
        document.getElementById('log-time-3').textContent = formatTime(h3, m3);

        logoutBtn.addEventListener('click', () => {
            clearSession();
            window.location.replace('login.html');
        });
    }

    // =========================================================================
    // HELPERS
    // =========================================================================
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

    function setReq(element, isOk) {
        element.className = `req-item ${isOk ? 'valid' : 'invalid'}`;
        element.querySelector('.bullet').textContent = isOk ? '✔' : '✖';
    }
});
