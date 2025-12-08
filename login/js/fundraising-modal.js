document.addEventListener('DOMContentLoaded', () => {
    // Initialize all DOM elements
    const modal = document.getElementById('fundraisingModal');
    const closeModal = document.querySelector('.close-modal');
    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.slide');
    const prevButton = document.querySelector('.slider-nav.prev');
    const nextButton = document.querySelector('.slider-nav.next');
    const amountOptions = document.querySelectorAll('.amount-option');
    const customAmountInput = document.querySelector('.custom-amount input');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const donateButton = document.querySelector('.donate-button');
    const donationForm = document.querySelector('.donation-form');

    let currentSlide = 0;
    let selectedAmount = 0;
    let selectedPaymentMethod = null;

    // Show modal
    function showModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Hide modal
    function hideModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close modal when clicking outside or close button
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === closeModal) {
            hideModal();
        }
    });

    // Image slider functionality
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // Amount selection
    amountOptions.forEach(option => {
        option.addEventListener('click', () => {
            amountOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            if (option.textContent === 'Custom') {
                document.querySelector('.custom-amount').style.display = 'block';
                selectedAmount = 0;
            } else {
                document.querySelector('.custom-amount').style.display = 'none';
                selectedAmount = parseInt(option.textContent.replace('₨', '').replace(',', ''));
            }
        });
    });

    // Custom amount input
    customAmountInput.addEventListener('input', (e) => {
        selectedAmount = parseInt(e.target.value) || 0;
    });

    // Payment method selection
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            selectedPaymentMethod = method.dataset.method;
        });
    });

    // Donate button click
    donateButton.addEventListener('click', () => {
        if (!selectedAmount) {
            showError('Please select an amount');
            return;
        }

        if (!selectedPaymentMethod) {
            showError('Please select a payment method');
            return;
        }

        // Simulate payment processing
        processPayment(selectedAmount, selectedPaymentMethod);
    });

    // Payment processing
    async function processPayment(amount, method) {
        try {
            // Show loading state
            donateButton.textContent = 'Processing...';
            donateButton.disabled = true;

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success message
            showSuccess(`Payment of ₨${amount} processed successfully via ${method}`);
            
            // Reset form
            resetForm();
            
            // Close modal after 2 seconds
            setTimeout(hideModal, 2000);
        } catch (error) {
            showError('Payment failed. Please try again.');
            donateButton.textContent = 'Donate Now';
            donateButton.disabled = false;
        }
    }

    // Reset form
    function resetForm() {
        amountOptions.forEach(opt => opt.classList.remove('selected'));
        paymentMethods.forEach(m => m.classList.remove('selected'));
        customAmountInput.value = '';
        document.querySelector('.custom-amount').style.display = 'none';
        selectedAmount = 0;
        selectedPaymentMethod = null;
        donateButton.textContent = 'Donate Now';
        donateButton.disabled = false;
    }

    // Show error message
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.marginBottom = '1rem';
        errorElement.style.textAlign = 'center';

        const form = document.querySelector('.donation-form');
        form.insertBefore(errorElement, form.firstChild);

        setTimeout(() => {
            errorElement.remove();
        }, 3000);
    }

    // Show success message
    function showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;
        successElement.style.color = 'var(--success-color)';
        successElement.style.marginBottom = '1rem';
        successElement.style.textAlign = 'center';

        const form = document.querySelector('.donation-form');
        form.insertBefore(successElement, form.firstChild);

        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }

    // Event listeners
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);

    // Auto-advance slides every 5 seconds
    setInterval(nextSlide, 5000);

    // Make modal globally accessible
    window.showFundraisingModal = showModal;

    // Initialize image slider
    const slider = document.querySelector('.image-slider');
    const images = document.querySelectorAll('.slider-image');
    let currentImage = 0;

    function showImage(index) {
        images.forEach((img, i) => {
            img.style.display = i === index ? 'block' : 'none';
        });
    }

    // Show first image initially
    showImage(currentImage);

    // Handle slider navigation
    const prevBtn = document.querySelector('.slider-nav .prev');
    const nextBtn = document.querySelector('.slider-nav .next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentImage = (currentImage - 1 + images.length) % images.length;
            showImage(currentImage);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentImage = (currentImage + 1) % images.length;
            showImage(currentImage);
        });
    }

    // Donation form submission
    if (donationForm) {
        donationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!selectedAmount) {
                showError('Please select an amount');
                return;
            }
            if (!selectedPaymentMethod) {
                showError('Please select a payment method');
                return;
            }
            processPayment(selectedAmount, selectedPaymentMethod);
        });
    }
}); 