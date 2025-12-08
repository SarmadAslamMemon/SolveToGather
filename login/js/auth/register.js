document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');

    // Toggle password visibility
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            button.classList.toggle('fa-eye');
            button.classList.toggle('fa-eye-slash');
        });
    });

    // Password strength indicator
    passwordInput.addEventListener('input', () => {
        const strength = calculatePasswordStrength(passwordInput.value);
        updatePasswordStrengthIndicator(strength);
    });

    // Form submission
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        let hasError = false;

        // Validate first name (letters only)
        const firstName = document.getElementById('firstName');
        if (!firstName.value.trim()) {
            showFieldError(firstName, 'First name is required');
            hasError = true;
        } else if (!/^[A-Za-z\s]+$/.test(firstName.value.trim())) {
            showFieldError(firstName, 'First name should contain only letters');
            hasError = true;
        }

        // Validate last name (letters only)
        const lastName = document.getElementById('lastName');
        if (!lastName.value.trim()) {
            showFieldError(lastName, 'Last name is required');
            hasError = true;
        } else if (!/^[A-Za-z\s]+$/.test(lastName.value.trim())) {
            showFieldError(lastName, 'Last name should contain only letters');
            hasError = true;
        }

        // Validate email
        const email = document.getElementById('email');
        if (!email.value.trim()) {
            showFieldError(email, 'Email is required');
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showFieldError(email, 'Please enter a valid email address');
            hasError = true;
        }

        // Validate address
        const address = document.getElementById('address');
        if (!address.value.trim()) {
            showFieldError(address, 'Address is required');
            hasError = true;
        } else if (address.value.trim().length < 10) {
            showFieldError(address, 'Please enter a complete address (minimum 10 characters)');
            hasError = true;
        }

        // Validate community
        const community = document.getElementById('community');
        if (!community.value) {
            showFieldError(community, 'Please select your community');
            hasError = true;
        }

        // Validate phone (Pakistani format: 03XXXXXXXXX)
        const phone = document.getElementById('phone');
        if (!phone.value.trim()) {
            showFieldError(phone, 'Phone number is required');
            hasError = true;
        } else if (!/^03[0-9]{9}$/.test(phone.value.trim())) {
            showFieldError(phone, 'Please enter a valid Pakistani phone number (03XXXXXXXXX)');
            hasError = true;
        }

        // Validate NIC (optional)
        const nic = document.getElementById('nic');
        if (nic.value.trim() && !/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(nic.value.trim())) {
            showFieldError(nic, 'NIC must be in XXXXX-XXXXXXX-X format');
            hasError = true;
        }

        // Validate age (must be 18 or above)
        const age = document.getElementById('age');
        if (!age.value) {
            showFieldError(age, 'Age is required');
            hasError = true;
        } else {
            const ageNum = parseInt(age.value);
            if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
                showFieldError(age, 'Age must be between 18 and 120 years');
                hasError = true;
            }
        }

        // Validate gender
        const gender = document.getElementById('gender');
        if (!gender.value) {
            showFieldError(gender, 'Please select your gender');
            hasError = true;
        }

        // Validate password
        if (!passwordInput.value) {
            showFieldError(passwordInput, 'Password is required');
            hasError = true;
        } else if (passwordInput.value.length < 8) {
            showFieldError(passwordInput, 'Password must be at least 8 characters long');
            hasError = true;
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(passwordInput.value)) {
            showFieldError(passwordInput, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            hasError = true;
        }

        // Validate confirm password
        if (!confirmPasswordInput.value) {
            showFieldError(confirmPasswordInput, 'Please confirm your password');
            hasError = true;
        } else if (passwordInput.value !== confirmPasswordInput.value) {
            showFieldError(confirmPasswordInput, 'Passwords do not match');
            hasError = true;
        }

        if (hasError) return;

        // Get form data
        const formData = {
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim(),
            email: email.value.trim(),
            address: address.value.trim(),
            community: community.value,
            phone: phone.value.trim(),
            nic: nic.value.trim() || null,
            age: parseInt(age.value),
            gender: gender.value,
            password: passwordInput.value
        };

        try {
            // Here you would typically make an API call to your backend
            const response = await simulateRegistration(formData);
            
            if (response.success) {
                // Store user session
                localStorage.setItem('user', JSON.stringify({
                    email: formData.email,
                    type: 'user',
                    token: response.token
                }));

                // Redirect to dashboard
                window.location.href = '../../pages/dashboard/index.html';
            } else {
                showError(response.message);
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
            console.error('Registration error:', error);
        }
    });

    // Calculate password strength
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        
        // Contains number
        if (/\d/.test(password)) strength += 1;
        
        // Contains lowercase
        if (/[a-z]/.test(password)) strength += 1;
        
        // Contains uppercase
        if (/[A-Z]/.test(password)) strength += 1;
        
        // Contains special character
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        return strength;
    }

    // Update password strength indicator
    function updatePasswordStrengthIndicator(strength) {
        let strengthElement = document.querySelector('.password-strength');
        let strengthBar = document.querySelector('.password-strength-bar');
        let strengthText = document.querySelector('.password-strength-text');

        if (!strengthElement) {
            strengthElement = document.createElement('div');
            strengthElement.className = 'password-strength';
            strengthBar = document.createElement('div');
            strengthBar.className = 'password-strength-bar';
            strengthText = document.createElement('div');
            strengthText.className = 'password-strength-text';
            
            strengthElement.appendChild(strengthBar);
            passwordInput.parentNode.appendChild(strengthElement);
            passwordInput.parentNode.appendChild(strengthText);
        }

        let color, text;
        switch (strength) {
            case 0:
            case 1:
                color = '#ef4444';
                text = 'Very Weak';
                break;
            case 2:
                color = '#f97316';
                text = 'Weak';
                break;
            case 3:
                color = '#eab308';
                text = 'Medium';
                break;
            case 4:
                color = '#22c55e';
                text = 'Strong';
                break;
            case 5:
                color = '#10b981';
                text = 'Very Strong';
                break;
        }

        strengthBar.style.width = `${(strength / 5) * 100}%`;
        strengthBar.style.backgroundColor = color;
        strengthText.textContent = text;
    }

    // Simulate registration (replace with actual API call)
    async function simulateRegistration(formData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    token: 'user-token-123',
                    message: 'Registration successful'
                });
            }, 1000);
        });
    }

    // Show error message
    function showError(message) {
        let errorElement = document.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            registrationForm.insertBefore(errorElement, registrationForm.lastElementChild);
        }
        errorElement.textContent = message;
    }

    // Show error message for a specific field
    function showFieldError(input, message) {
        let errorElement = input.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('small');
            errorElement.className = 'error-message';
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
}); 