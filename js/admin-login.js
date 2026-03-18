// admin-login.js

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        window.location.href = '/dashboard.html';
    }

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.getElementById('submitBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Reset state
        errorMsg.classList.add('hidden');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Authenticating...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and redirect
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', data.username);
                window.location.href = '/dashboard.html';
            } else {
                // Show error
                errorMsg.textContent = data.message || 'Login failed';
                errorMsg.classList.remove('hidden');
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorMsg.textContent = 'Server error. Please try again later.';
            errorMsg.classList.remove('hidden');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
