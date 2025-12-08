document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    // Update user profile information
    updateUserProfile(user);

    // Setup profile image picker
    setupProfileImagePicker();

    // Handle logout
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', handleLogout);

    // Handle search
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', handleSearch);

    // Handle notifications
    const notifications = document.querySelector('.notifications');
    notifications.addEventListener('click', handleNotifications);

    // Load dashboard data
    loadDashboardData();
});

// Update user profile information
function updateUserProfile(user) {
    const userProfile = document.querySelector('.user-profile span');
    userProfile.textContent = user.name || 'User';
}

// Setup profile image picker
function setupProfileImagePicker() {
    const profileImageContainer = document.querySelector('.profile-image-container');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImage = document.getElementById('profileImage');

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
                    // and update the user's profile image URL
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

// Handle logout
function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = '../../pages/auth/login.html';
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Here you would typically make an API call to search for issues and campaigns
    // For now, we'll just log the search term
    console.log('Searching for:', searchTerm);
}

// Handle notifications
function handleNotifications() {
    // Here you would typically show a notifications dropdown or modal
    // For now, we'll just log the click
    console.log('Notifications clicked');
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Here you would typically make API calls to fetch dashboard data
        // For now, we'll simulate the data
        const dashboardData = await simulateDashboardData();
        
        // Update trending issues
        updateTrendingIssues(dashboardData.trendingIssues);
        
        // Update fundraising campaigns
        updateFundraisingCampaigns(dashboardData.fundraisingCampaigns);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update trending issues
function updateTrendingIssues(issues) {
    const issuesGrid = document.querySelector('.issues-grid');
    issuesGrid.innerHTML = issues.map(issue => `
        <article class="issue-card">
            <div class="issue-image">
                <img src="${issue.image}" alt="${issue.title}">
            </div>
            <div class="issue-content">
                <h3>${issue.title}</h3>
                <p>${issue.description}</p>
                <div class="issue-meta">
                    <span class="likes"><i class="fas fa-heart"></i> ${issue.likes}</span>
                    <span class="comments"><i class="fas fa-comment"></i> ${issue.comments}</span>
                </div>
            </div>
        </article>
    `).join('');
}

// Update fundraising campaigns
function updateFundraisingCampaigns(campaigns) {
    const campaignsGrid = document.querySelector('.campaigns-grid');
    campaignsGrid.innerHTML = campaigns.map(campaign => `
        <article class="campaign-card">
            <div class="campaign-progress">
                <div class="progress-bar" style="width: ${(campaign.raised / campaign.goal) * 100}%"></div>
            </div>
            <div class="campaign-content">
                <h3>${campaign.title}</h3>
                <p>${campaign.description}</p>
                <div class="campaign-meta">
                    <span class="raised">$${campaign.raised} raised of $${campaign.goal}</span>
                    <span class="days-left">${campaign.daysLeft} days left</span>
                </div>
            </div>
        </article>
    `).join('');
}

// Simulate dashboard data (replace with actual API calls)
async function simulateDashboardData() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                trendingIssues: [
                    {
                        title: 'Road Repairs Needed',
                        description: 'Main street requires urgent repairs due to potholes and drainage issues.',
                        image: '../../assets/images/issue1.jpg',
                        likes: 45,
                        comments: 12
                    },
                    {
                        title: 'Community Garden Project',
                        description: 'New community garden initiative seeking volunteers and donations.',
                        image: '../../assets/images/issue2.jpg',
                        likes: 32,
                        comments: 8
                    }
                ],
                fundraisingCampaigns: [
                    {
                        title: 'School Renovation Fund',
                        description: 'Help us renovate the local school\'s playground and library.',
                        raised: 7500,
                        goal: 10000,
                        daysLeft: 15
                    },
                    {
                        title: 'Community Center Upgrade',
                        description: 'Support our community center\'s technology upgrade project.',
                        raised: 4500,
                        goal: 10000,
                        daysLeft: 30
                    }
                ]
            });
        }, 1000);
    });
} 