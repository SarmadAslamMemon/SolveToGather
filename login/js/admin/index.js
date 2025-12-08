document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    const user = JSON.parse(localStorage.getItem('user'));
    // if (!user || !user.isAdmin) {
    //     window.location.href = '/pages/login/index.html';
    //     return;
    // }

    // Initialize admin panel
    initializeAdminPanel();

    // Setup admin profile image picker
    setupAdminProfileImagePicker();
});

function initializeAdminPanel() {
    // Load dashboard data
    loadDashboardData();

    // Set up event listeners
    setupEventListeners();

    // Update user profile
    updateUserProfile();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Notifications
    const notifications = document.querySelector('.notifications');
    if (notifications) {
        notifications.addEventListener('click', handleNotifications);
    }

    // Logout
    const logoutButton = document.querySelector('.logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Approval buttons
    document.querySelectorAll('.approve-button').forEach(button => {
        button.addEventListener('click', (e) => handleApproval(e, true));
    });

    document.querySelectorAll('.reject-button').forEach(button => {
        button.addEventListener('click', (e) => handleApproval(e, false));
    });
}

function updateUserProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    const profileName = document.querySelector('.user-profile span');
    if (profileName && user) {
        profileName.textContent = user.name;
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Implement search functionality
    console.log('Searching for:', searchTerm);
}

function handleNotifications() {
    // Implement notifications functionality
    console.log('Notifications clicked');
}

function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '/pages/login/index.html';
}

async function handleApproval(e, isApproved) {
    const approvalItem = e.target.closest('.approval-item');
    const paymentId = approvalItem.dataset.id;

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update UI
        approvalItem.remove();
        
        // Show success message
        showNotification(isApproved ? 'Payment approved successfully' : 'Payment rejected successfully');
    } catch (error) {
        console.error('Error handling approval:', error);
        showNotification('Error processing request', true);
    }
}

async function loadDashboardData() {
    try {
        // Simulate API call
        const data = await new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    stats: {
                        totalCommunities: 42,
                        totalFunds: 125000,
                        pendingIssues: 8,
                        resolvedIssues: 156
                    },
                    recentActivities: [
                        {
                            type: 'new_community',
                            title: 'New Community Created',
                            description: 'Green Energy Initiative community was created',
                            time: '2 hours ago'
                        },
                        {
                            type: 'payment',
                            title: 'New Payment Received',
                            description: 'Received $500 for Community Development',
                            time: '4 hours ago'
                        },
                        {
                            type: 'issue',
                            title: 'Issue Reported',
                            description: 'New issue reported in Urban Gardening community',
                            time: '6 hours ago'
                        }
                    ],
                    pendingApprovals: [
                        {
                            id: 1,
                            title: 'Community Development Fund',
                            amount: 2500,
                            community: 'Urban Gardening',
                            time: '2 hours ago'
                        },
                        {
                            id: 2,
                            title: 'Educational Program',
                            amount: 1500,
                            community: 'Youth Empowerment',
                            time: '4 hours ago'
                        }
                    ]
                });
            }, 1000);
        });

        // Update dashboard with data
        updateStats(data.stats);
        updateRecentActivities(data.recentActivities);
        updatePendingApprovals(data.pendingApprovals);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', true);
    }
}

function updateStats(stats) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return;

    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
                <h3>Total Communities</h3>
                <div class="stat-value">${stats.totalCommunities}</div>
                <div class="stat-change positive">+5 this month</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-dollar-sign"></i>
            </div>
            <div class="stat-content">
                <h3>Total Funds Raised</h3>
                <div class="stat-value">$${stats.totalFunds.toLocaleString()}</div>
                <div class="stat-change positive">+12% this month</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <div class="stat-content">
                <h3>Pending Issues</h3>
                <div class="stat-value">${stats.pendingIssues}</div>
                <div class="stat-change negative">+2 today</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
                <h3>Resolved Issues</h3>
                <div class="stat-value">${stats.resolvedIssues}</div>
                <div class="stat-change positive">+15 this week</div>
            </div>
        </div>
    `;
}

function updateRecentActivities(activities) {
    const activitiesList = document.querySelector('.activities-list');
    if (!activitiesList) return;

    activitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <h3>${activity.title}</h3>
                <p>${activity.description}</p>
                <div class="activity-time">${activity.time}</div>
            </div>
            <button class="action-button">View Details</button>
        </div>
    `).join('');
}

function updatePendingApprovals(approvals) {
    const approvalsList = document.querySelector('.approvals-list');
    if (!approvalsList) return;

    approvalsList.innerHTML = approvals.map(approval => `
        <div class="approval-item" data-id="${approval.id}">
            <div class="approval-content">
                <h3>${approval.title}</h3>
                <p>Amount: $${approval.amount.toLocaleString()}</p>
                <p>Community: ${approval.community}</p>
                <div class="activity-time">${approval.time}</div>
            </div>
            <div class="approval-actions">
                <button class="approve-button">Approve</button>
                <button class="reject-button">Reject</button>
            </div>
        </div>
    `).join('');

    // Reattach event listeners to new buttons
    document.querySelectorAll('.approve-button').forEach(button => {
        button.addEventListener('click', (e) => handleApproval(e, true));
    });
    document.querySelectorAll('.reject-button').forEach(button => {
        button.addEventListener('click', (e) => handleApproval(e, false));
    });
}

function getActivityIcon(type) {
    const icons = {
        new_community: 'users',
        payment: 'dollar-sign',
        issue: 'exclamation-circle'
    };
    return icons[type] || 'info-circle';
}

function showNotification(message, isError = false) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;

    // Add to DOM
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const createPostBtn = document.getElementById('createPostBtn');
    const createFundraisingBtn = document.getElementById('createFundraisingBtn');
    const postModal = document.getElementById('postModal');
    const fundraisingModal = document.getElementById('fundraisingModal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Open modals
    createPostBtn.addEventListener('click', () => openModal(postModal));
    createFundraisingBtn.addEventListener('click', () => openModal(fundraisingModal));
    
    // Close modals
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    // Handle image upload for post creation
    setupImageUpload('imageUploadArea', 'imageInput', 'imagePreview');
    setupImageUpload('fundraisingImageUploadArea', 'fundraisingImageInput', 'fundraisingImagePreview');

    // Handle form submissions
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
    document.getElementById('fundraisingForm').addEventListener('submit', handleFundraisingSubmit);
});

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Reset form and preview
    const form = modal.querySelector('form');
    const preview = modal.querySelector('.image-preview');
    if (form) form.reset();
    if (preview) preview.innerHTML = '';
}

function setupImageUpload(areaId, inputId, previewId) {
    const uploadArea = document.getElementById(areaId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    // Click on upload area
    uploadArea.addEventListener('click', () => fileInput.click());

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.background = 'rgba(79, 70, 229, 0.05)';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        const files = e.dataTransfer.files;
        handleFiles(files, preview);
    });

    // Handle file input change
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files, preview);
    });
}

function handleFiles(files, preview) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-image';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button class="remove-image">
                    <span class="material-icons">close</span>
                </button>
            `;

            div.querySelector('.remove-image').addEventListener('click', () => {
                div.remove();
            });

            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

function handlePostSubmit(e) {
    e.preventDefault();
    // Get form data
    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;
    const images = Array.from(document.querySelectorAll('#imagePreview img')).map(img => img.src);

    // Here you would typically send this data to your backend
    console.log('Post Data:', { title, description, images });
    
    // Close modal after submission
    closeModal(document.getElementById('postModal'));
}

function handleFundraisingSubmit(e) {
    e.preventDefault();
    // Get form data
    const title = document.getElementById('campaignTitle').value;
    const amount = document.getElementById('targetAmount').value;
    const description = document.getElementById('campaignDescription').value;
    const images = Array.from(document.querySelectorAll('#fundraisingImagePreview img')).map(img => img.src);

    // Here you would typically send this data to your backend
    console.log('Fundraising Data:', { title, amount, description, images });
    
    // Close modal after submission
    closeModal(document.getElementById('fundraisingModal'));
}

// Setup admin profile image picker
function setupAdminProfileImagePicker() {
    const profileImageContainer = document.querySelector('.profile-image-container');
    const profileImageInput = document.getElementById('adminProfileImageInput');
    const profileImage = document.getElementById('adminProfileImage');

    profileImageContainer.addEventListener('click', () => {
        profileImageInput.click();
    });

    profileImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profileImage.src = e.target.result;
                    // Here you would typically upload the image to your backend
                    // and update the admin's profile image URL
                    const user = JSON.parse(localStorage.getItem('user'));
                    if (user) {
                        user.profileImage = e.target.result;
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select an image file');
            }
        }
    });
} 