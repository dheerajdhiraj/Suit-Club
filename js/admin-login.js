// admin-login.js

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in (Firebase)
    auth.onAuthStateChanged((user) => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const submitBtn = document.getElementById('submitBtn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Reset state
        errorMsg.classList.add('hidden');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Authenticating...';
        submitBtn.disabled = true;

        try {
            // Firebase Sign In
            await auth.signInWithEmailAndPassword(email, password);
            // On success, Firebase onAuthStateChanged would typically handle redirect, 
            // but we can also do it here if we want immediate feedback.
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error during login:', error);
            errorMsg.textContent = error.message || 'Invalid email or password.';
            errorMsg.classList.remove('hidden');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
