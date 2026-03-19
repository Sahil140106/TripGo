// Check Authentication State on Load
(function() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
        try {
            const user = JSON.parse(userStr);
            // Redirect if already logged in (used on login/signup pages)
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
                window.location.href = 'index.html';
            }
        } catch(e) {}
    }
})();

// Helper to show errors
function showAuthError(msg) {
    const errDiv = document.getElementById('error-message');
    if (errDiv) {
        errDiv.textContent = msg;
        errDiv.style.display = 'block';
    }
}

// Password Visibility Toggle Logic
function togglePasswordVisibility(btn) {
    const wrapper = btn.closest('.password-field-wrapper');
    const input = wrapper.querySelector('input');
    const icon = btn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// --- Login Logic ---
const loginForms = {
    user: `
        <div class="form-group">
            <label>Email, Username, or Mobile</label>
            <input type="text" placeholder="Enter Email, Username, or Mobile" required>
        </div>
        <div class="form-group">
            <label>Password</label>
            <div class="password-field-wrapper">
                <input type="password" placeholder="••••••••" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `,
    admin: `
        <div class="form-group">
            <label>Admin ID, Email, Username, or Mobile</label>
            <input type="text" placeholder="Enter Admin ID, Email, Username, or Mobile" required>
        </div>
        <div class="form-group">
            <label>Password</label>
            <div class="password-field-wrapper">
                <input type="password" placeholder="••••••••" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `
};

function switchLoginForm(role) {
    const dynamicLoginFields = document.getElementById('dynamic-login-fields');
    if (dynamicLoginFields) {
        dynamicLoginFields.innerHTML = loginForms[role];
    }
}

// --- Signup Logic ---
const signupForms = {
    user: `
        <h4>Personal & Identity</h4>
        <div class="form-group"><label>Full Name</label><input type="text" placeholder="Full Name" required></div>
        <div class="form-group"><label>Mobile Number</label><input type="tel" placeholder="Mobile Number" required></div>
        <div class="form-group"><label>Email ID</label><input type="email" placeholder="Email ID" required></div>
        <div class="form-group">
            <label>Password</label>
            <div class="password-field-wrapper">
                <input type="password" placeholder="Password" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
        <div class="form-group">
            <label>Confirm Password</label>
            <div class="password-field-wrapper">
                <input type="password" placeholder="Confirm Password" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `,
    admin: `
        <h4>Basic Details</h4>
        <div class="form-group"><label>Full Name</label><input type="text" placeholder="Full Name" required></div>
        <div class="form-group"><label>Username / Admin ID</label><input type="text" placeholder="Admin ID" required></div>
        <div class="form-group"><label>Email ID</label><input type="email" placeholder="Email ID" required></div>
        <div class="form-group"><label>Mobile Number</label><input type="tel" placeholder="Mobile Number" required></div>
        
        <h4>Professional Details</h4>
        <div class="form-group">
            <label>Admin Code / Secret Key</label>
            <div class="password-field-wrapper">
                <input type="password" id="admin-key" placeholder="Enter Secret Code" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>

        <h4>Login Credentials</h4>
        <div class="form-group">
            <label>Password</label>
            <div class="password-field-wrapper">
                <input type="password" placeholder="Password" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
        <div class="form-group">
            <label>Confirm Password</label>
            <div class="password-field-wrapper">
                <input type="password" placeholder="Confirm Password" required>
                <button type="button" class="toggle-password-btn" onclick="togglePasswordVisibility(this)">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `
};

function switchSignupForm(role) {
    const dynamicFields = document.getElementById('dynamic-fields');
    const formTitle = document.getElementById('form-title');
    if (dynamicFields) {
        dynamicFields.innerHTML = signupForms[role];
        if (formTitle) {
            formTitle.innerText = role === 'admin' ? "Admin Registration" : "Create Account";
        }
    }
}

// Initialize listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const apiHost = window.location.hostname || '127.0.0.1';
    
    // Role selector buttons
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            roleButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const role = btn.getAttribute('data-role');
            if (document.getElementById('loginForm')) {
                switchLoginForm(role);
            } else if (document.getElementById('signupForm')) {
                switchSignupForm(role);
            }
        });
    });

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errDiv = document.getElementById('error-message');
            if (errDiv) errDiv.style.display = 'none';

            const role = document.querySelector('.role-btn.active').dataset.role;
            const fields = document.getElementById('dynamic-login-fields').querySelectorAll('input');
            const identifier = fields[0].value;
            const password = fields[1].value;

            try {
                const response = await fetch(`${AUTH_API_URL}/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (role === 'admin') {
                        data.user.role = 'ADMIN';
                    } else {
                        data.user.role = 'USER';
                    }
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    window.location.href = 'index.html';
                } else {
                    const error = await response.text();
                    showAuthError("Login failed: " + error);
                }
            } catch (err) {
                showAuthError("Server error: " + err.message);
            }
        });
    }

    // Signup Form Submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errDiv = document.getElementById('error-message');
            if (errDiv) errDiv.style.display = 'none';

            const role = document.querySelector('.role-btn.active').dataset.role;
            const dynamicFields = document.getElementById('dynamic-fields');
            const inputs = dynamicFields.querySelectorAll('input');
            
            let userData = {
                fullName: inputs[0].value,
                email: role === 'user' ? inputs[2].value : inputs[2].value,
                mobileNumber: role === 'user' ? inputs[1].value : inputs[3].value
            };

            if (role === 'user') {
                userData.password = inputs[3].value;
                const confirmPassword = inputs[4].value;
                if (userData.password !== confirmPassword) {
                    showAuthError("Passwords do not match!");
                    return;
                }
            } else {
                const key = document.getElementById('admin-key').value;
                if (key !== "1234A") {
                    showAuthError("Access Denied: Incorrect Admin Secret Key.");
                    return;
                }
                userData.adminId = inputs[1].value;
                userData.role = "ADMIN";
                userData.password = inputs[5].value;
                const confirmPassword = inputs[6].value;
                if (userData.password !== confirmPassword) {
                    showAuthError("Passwords do not match!");
                    return;
                }
            }

            try {
                const response = await fetch(`${AUTH_API_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    alert("Signup successful! Please login.");
                    window.location.href = 'login.html';
                } else {
                    const error = await response.text();
                    showAuthError("Signup failed: " + error);
                }
            } catch (err) {
                showAuthError("Server error: " + err.message);
            }
        });
    }

    // OTP Logic
    const sendOtpBtn = document.getElementById('send-otp-btn');
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            const role = document.querySelector('.role-btn.active').dataset.role;
            const dynamicFields = document.getElementById('dynamic-fields');
            const inputs = dynamicFields.querySelectorAll('input');
            const email = role === 'user' ? inputs[2].value : inputs[2].value;

            if (!email) {
                showAuthError("Please enter your email first.");
                return;
            }

            sendOtpBtn.disabled = true;
            sendOtpBtn.innerText = "Sending...";

            try {
                const response = await fetch(`${OTP_API_URL}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (response.ok) {
                    alert("OTP sent to " + email);
                    document.getElementById('otp-section').style.display = 'block';
                    sendOtpBtn.innerText = "Resend OTP";
                } else {
                    const errorText = await response.text();
                    try {
                        const data = JSON.parse(errorText);
                        showAuthError(data.message || "Failed to send OTP.");
                    } catch(e) {
                         showAuthError("Server Error (" + response.status + "): " + errorText);
                    }
                }
            } catch (err) {
                showAuthError("Failed to send OTP.");
            } finally {
                sendOtpBtn.disabled = false;
            }
        });
    }

    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const role = document.querySelector('.role-btn.active').dataset.role;
            const dynamicFields = document.getElementById('dynamic-fields');
            const inputs = dynamicFields.querySelectorAll('input');
            const email = role === 'user' ? inputs[2].value : inputs[2].value;
            const otpInput = document.getElementById('otp-input');
            const otp = otpInput.value;

            if (!otp) {
                showAuthError("Please enter OTP.");
                return;
            }

            try {
                const response = await fetch(`${OTP_API_URL}/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp })
                });
                const data = await response.json();

                if (data.status === 'success') {
                    alert("OTP Verified Successfully!");
                    document.getElementById('otp-section').style.display = 'none';
                    sendOtpBtn.style.display = 'none';
                    document.getElementById('submit-btn').style.display = 'block';
                    const emailInput = role === 'user' ? inputs[2] : inputs[2];
                    emailInput.readOnly = true;
                    emailInput.style.background = "#e9ecef";
                } else {
                    showAuthError(data.message);
                }
            } catch (err) {
                showAuthError("Connection Error: Could not reach the OTP service (Port 4000). Make sure 'START_ALL.bat' is running.");
                console.error("OTP Verify Error:", err);
            }
        });
    }

    // --- Forgot Password Logic ---
    const forgotLinks = document.getElementById('forgot-password-link');
    const resetSection = document.getElementById('reset-password-section');
    const loginFormEl = document.getElementById('loginForm');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');

    if (forgotLinks && resetSection && loginFormEl) {
        forgotLinks.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormEl.style.display = 'none';
            resetSection.style.display = 'block';
        });

        if (cancelResetBtn) {
            cancelResetBtn.addEventListener('click', () => {
                resetSection.style.display = 'none';
                loginFormEl.style.display = 'block';
            });
        }
    }

    const sendResetOtpBtn = document.getElementById('send-reset-otp-btn');
    const verifyResetBtn = document.getElementById('verify-reset-btn');
    const resetOtpGroup = document.getElementById('reset-otp-group');
    const resetEmailInput = document.getElementById('reset-email');

    if (sendResetOtpBtn) {
        sendResetOtpBtn.addEventListener('click', async () => {
            const email = resetEmailInput.value.trim();
            if (!email) {
                alert("Please enter your email.");
                return;
            }

            sendResetOtpBtn.disabled = true;
            sendResetOtpBtn.innerText = "Sending...";

            try {
                const response = await fetch(`${OTP_API_URL}/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (response.ok) {
                    alert("OTP sent to " + email);
                    resetOtpGroup.style.display = 'block';
                    sendResetOtpBtn.style.display = 'none';
                    verifyResetBtn.style.display = 'block';
                } else {
                    const errorText = await response.text();
                    try {
                        const data = JSON.parse(errorText);
                        alert(data.message || "Failed to send OTP.");
                    } catch(e) {
                        alert("Server Error (" + response.status + "): " + errorText);
                    }
                }
            } catch (err) {
                alert("Failed to send OTP.");
            } finally {
                sendResetOtpBtn.disabled = false;
                sendResetOtpBtn.innerText = "Send OTP";
            }
        });
    }

    if (verifyResetBtn) {
        verifyResetBtn.addEventListener('click', async () => {
            const email = resetEmailInput.value.trim();
            const otp = document.getElementById('reset-otp').value.trim();
            const newPassword = document.getElementById('reset-new-password').value.trim();
            const role = document.querySelector('.role-btn.active').dataset.role.toUpperCase();

            if (!otp || !newPassword) {
                alert("Please enter OTP and new password.");
                return;
            }

            try {
                // 1. Verify OTP
                const vResponse = await fetch(`${OTP_API_URL}/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp })
                });
                const vData = await vResponse.json();

                if (vData.status !== 'success') {
                    alert("Invalid OTP.");
                    return;
                }

                // 2. Update Password
                const rResponse = await fetch(`${AUTH_API_URL}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, role, newPassword })
                });

                if (rResponse.ok) {
                    alert("Password reset successful! Please login with your new password.");
                    resetSection.style.display = 'none';
                    loginFormEl.style.display = 'block';
                    // Reset fields
                    resetEmailInput.value = '';
                    document.getElementById('reset-otp').value = '';
                    document.getElementById('reset-new-password').value = '';
                    resetOtpGroup.style.display = 'none';
                    sendResetOtpBtn.style.display = 'block';
                    verifyResetBtn.style.display = 'none';
                } else {
                    const err = await rResponse.text();
                    alert("Reset failed: " + err);
                }
            } catch (err) {
                alert("An error occurred during password reset.");
            }
        });
    }
});
