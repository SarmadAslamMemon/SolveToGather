// Sample data for posts
const posts = [
    {
        id: 1,
        title: "Exciting News!",
        content: "Just launched our new product line. Check it out!",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        likes: 42,
        comments: 5,
        image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop",
        author: "John Doe",
        authorImage: "../images/p10.png",
        commentsList: [
            {
                id: 1,
                author: "Jane Smith",
                content: "This looks amazing!",
                timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
                // authorImage: "../images/p10.png"
            }
        ]
    },
    {
        id: 2,
        title: "Tech Update",
        content: "Our latest software update includes several new features and improvements.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        likes: 28,
        comments: 3,
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
        author: "Tech Team",
        authorImage: "../images/p10.png",
        commentsList: []
    },
    {
        id: 3,
        title: "Team Building Event",
        content: "Had an amazing team building session today! Building stronger connections and having fun together.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        likes: 56,
        comments: 8,
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
        author: "HR Department",
        authorImage: "../images/p10.png",
        commentsList: []
    },
    {
        id: 4,
        title: "New Office Space",
        content: "We're excited to announce our new office space! Modern, comfortable, and designed for collaboration.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        likes: 89,
        comments: 12,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
        author: "Operations Team",
        authorImage: "../images/p10.png",
        commentsList: []
    }
];

const currentUser = {
    name: "Current User",
    image: "../images/p10.png",
    likedPosts: new Set()
};

// Format time to relative format
function formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return timestamp.toLocaleDateString();
}

// Create HTML for a post
function createPostHTML(post) {
    const isLiked = currentUser.likedPosts.has(post.id);
    
    return `
        <div class="post-card">
            <div class="post-header">
            <div class="post-info">
                    <h5>${post.title}</h5>
                    <div class="post-meta">
                        <span>${post.author}</span>
                        <span>•</span>
                        <span>${formatTime(post.timestamp)}</span>
                    </div>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
                ${post.image ? `
                    <div class="post-image-container">
                        <img src="${post.image}" 
                             alt="Post content" 
                             class="post-content-image" 
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600?text=Image+Not+Available';">
                    </div>
                ` : ''}
            </div>
            <div class="post-actions">
                <button class="btn btn-link ${isLiked ? 'text-danger' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i> ${post.likes}
                </button>
                <button class="btn btn-link" onclick="openPostModal(${post.id})">
                    <i class="fas fa-comment"></i> ${post.comments}
                </button>
                <button class="btn btn-link" onclick="showShareModal(${post.id})">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        </div>
    `;
}

// Add loading state management
let isLoading = false;

// Load posts with loading state
function loadPosts() {
    if (isLoading) return;
    
    const container = document.getElementById('posts-container');
    
    try {
        isLoading = true;
        container.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        // Simulate network delay for demo purposes
        setTimeout(() => {
            container.innerHTML = posts.map(post => createPostHTML(post)).join('');
            isLoading = false;
        }, 300);
    } catch (error) {
        console.error('Error loading posts:', error);
        container.innerHTML = '<div class="alert alert-danger">Error loading posts. Please try again.</div>';
        isLoading = false;
    }
}

// Toggle like on a post without full reload
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (currentUser.likedPosts.has(postId)) {
        currentUser.likedPosts.delete(postId);
        post.likes--;
    } else {
        currentUser.likedPosts.add(postId);
        post.likes++;
    }

    // Update only the like count instead of reloading all posts
    const likeButton = document.querySelector(`[onclick="toggleLike(${postId})"]`);
    if (likeButton) {
        likeButton.innerHTML = `<i class="fas fa-heart"></i> ${post.likes}`;
        likeButton.classList.toggle('text-danger', currentUser.likedPosts.has(postId));
    }
}

// Show share modal
function showShareModal(postId) {
    const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
    const shareLink = document.getElementById('shareLink');
    shareLink.value = window.location.href;
    shareModal.show();
}

// Open post modal
function openPostModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const modalContent = document.getElementById('modal-post-content');
    modalContent.innerHTML = `
        <div class="post-detail">
            <div class="post-header">
                <img src="${post.authorImage || '../images/p10.png'}" alt="${post.author}" class="post-image" onerror="this.src='../images/p10.png'">
                <div class="post-info">
                    <h5>${post.title}</h5>
                    <div class="post-meta">
                        <span>${post.author}</span>
                        <span>•</span>
                        <span>${formatTime(post.timestamp)}</span>
                    </div>
                </div>
            </div>
            <div class="post-content">
                <p>${post.content}</p>
                ${post.image ? `
                    <div class="post-image-container">
                        <img src="${post.image}" 
                             alt="Post content" 
                             class="post-content-image" 
                             onerror="this.onerror=null; this.src='https://via.placeholder.com/800x600?text=Image+Not+Available';">
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = post.commentsList.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <img src="${comment.authorImage || '../images/p10.png'}" alt="${comment.author}" class="comment-avatar" onerror="this.src='../images/p10.png'">
                <div class="comment-info">
                    <strong>${comment.author}</strong>
                    <small>${formatTime(comment.timestamp)}</small>
                </div>
            </div>
            <p>${comment.content}</p>
        </div>
    `).join('');

    const postModal = new bootstrap.Modal(document.getElementById('postModal'));
    postModal.show();
}

// Submit comment without reload
function submitComment() {
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    
    if (!content) return;

    const newComment = {
        id: Date.now(),
        author: currentUser.name,
        content: content,
        timestamp: new Date(),
        authorImage: currentUser.image
    };

    // Add comment to the first post for demo purposes
    posts[0].commentsList.push(newComment);
    posts[0].comments++;

    input.value = '';
    
    // Update only the comments section in the modal
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
        const commentHTML = `
            <div class="comment">
                <div class="comment-header">
                    <img src="${newComment.authorImage}" alt="${newComment.author}" class="comment-avatar" onerror="this.src='../images/p10.png'">
                    <div class="comment-info">
                        <strong>${newComment.author}</strong>
                        <small>${formatTime(newComment.timestamp)}</small>
                    </div>
                </div>
                <p>${newComment.content}</p>
            </div>
        `;
        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
    }

    // Update comment count in the post card
    const commentButton = document.querySelector(`[onclick="openPostModal(${posts[0].id})"]`);
    if (commentButton) {
        commentButton.innerHTML = `<i class="fas fa-comment"></i> ${posts[0].comments}`;
    }
}

// Share functionality
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    
    const button = shareLink.nextElementSibling;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?url=${url}`, '_blank');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${url}`, '_blank');
}

function shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${url}`, '_blank');
}

// Drawer functionality
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    const toggleBtn = document.getElementById('navToggle');
    const overlay = document.querySelector('.drawer-overlay');
    const isMobile = window.innerWidth <= 768;
    
    drawer.classList.toggle('show');
    toggleBtn.classList.toggle('active');
    
    // Change icon based on drawer state
    const icon = toggleBtn.querySelector('i');
    if (drawer.classList.contains('show')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
        toggleBtn.setAttribute('title', 'Close Menu');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        toggleBtn.setAttribute('title', 'Open Menu');
    }
    
    // Toggle overlay
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'drawer-overlay';
        document.body.appendChild(newOverlay);
        
        newOverlay.addEventListener('click', closeDrawer);
    }
    
    if (drawer.classList.contains('show')) {
        document.querySelector('.drawer-overlay').classList.add('show');
        // Lock body scroll when drawer is open on mobile
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
    } else {
        document.querySelector('.drawer-overlay')?.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Function to close drawer
function closeDrawer() {
    const drawer = document.getElementById('drawer');
    const toggleBtn = document.getElementById('navToggle');
    const overlay = document.querySelector('.drawer-overlay');
    
    drawer.classList.remove('show');
    toggleBtn.classList.remove('active');
    const icon = toggleBtn.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
    toggleBtn.setAttribute('title', 'Open Menu');
    overlay?.classList.remove('show');
    document.body.style.overflow = '';
}

// Close drawer when clicking outside
document.addEventListener('click', function(event) {
    const drawer = document.getElementById('drawer');
    const toggleBtn = document.getElementById('navToggle');
    
    if (!drawer.contains(event.target) && 
        !toggleBtn.contains(event.target) && 
        !event.target.closest('.profile-section')) {
        closeDrawer();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    const drawer = document.getElementById('drawer');
    if (window.innerWidth > 768 && drawer.classList.contains('show')) {
        // Adjust toggle button position for desktop
        document.getElementById('navToggle').style.left = 'calc(280px + 1rem)';
    }
});

// User details toggle
function toggleUserDetails() {
    const content = document.getElementById('userDetailsContent');
    const icon = content.previousElementSibling.querySelector('i');
    
    content.classList.toggle('show');
    icon.classList.toggle('fa-chevron-up');
    icon.classList.toggle('fa-chevron-down');
}

// Prevent form submission reload
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Load posts initially
    loadPosts();

    // Prevent form submissions from reloading the page
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            return false;
        });
    });

    // Handle comment submission without reload
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitComment();
            return false;
        });
    }

    // Initialize drawer state
    const toggleBtn = document.getElementById('navToggle');
    toggleBtn.setAttribute('title', 'Open Menu');
}); 