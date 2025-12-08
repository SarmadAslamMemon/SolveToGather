document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('loginButton');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.querySelector('.toggle-password');
    const userTypeRadios = document.querySelectorAll('input[name="userType"]');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // Handle login
    loginButton.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const userType = document.querySelector('input[name="userType"]:checked').value;

        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Static validation
        if (userType === 'admin' && email === 'admin@example.com' && password === 'admin123') {
            // Store user session
            localStorage.setItem('user', JSON.stringify({
                email,
                type: userType,
                name: 'Admin User'
            }));

            // Redirect to admin dashboard
            window.location.href = '../admin/index.html';
        } else if (userType === 'user' && email === 'user@example.com' && password === 'user123') {
            // Store user session
            localStorage.setItem('user', JSON.stringify({
                email,
                type: userType,
                name: 'John Doe'
            }));

            // Redirect to user dashboard
            window.location.href = '../dashboard/index.html';
        } else {
            showError('Invalid credentials');
        }
    });

    // Show error message
    function showError(message) {
        // Create error message element if it doesn't exist
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            document.querySelector('.auth-form').insertBefore(errorElement, loginButton);
        }

        errorElement.textContent = message;
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.marginBottom = '1rem';
        errorElement.style.textAlign = 'center';
    }
}); 