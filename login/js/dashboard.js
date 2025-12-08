document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Handle logout button
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Add logout functionality here
            window.location.href = '../../index.html';
        });
    }

    // Handle notifications
    const notificationsButton = document.querySelector('.notifications');
    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            // Add notifications functionality here
            console.log('Notifications clicked');
        });
    }

    // Handle search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Add search functionality here
            console.log('Search:', e.target.value);
        });
    }

    // Handle issue card clicks
    const issueCards = document.querySelectorAll('.issue-card');
    issueCards.forEach(card => {
        card.addEventListener('click', () => {
            // Add issue details functionality here
            console.log('Issue card clicked');
        });
    });

    // Handle campaign card clicks
    const campaignCards = document.querySelectorAll('.campaign-card');
    campaignCards.forEach(card => {
        card.addEventListener('click', () => {
            showFundraisingModal();
        });
    });

    // Make showFundraisingModal globally accessible
    window.showFundraisingModal = showFundraisingModal;
});

// Function to show the fundraising modal
function showFundraisingModal() {
    const modal = document.getElementById('fundraisingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
} 