function showSignup() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.remove("hidden");
    document.getElementById("imageHeading").innerText = "Join Us Today!";
    document.getElementById("imageText").innerText = "Create an account to get started.";
}

function showLogin() {
    document.getElementById("signupForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("imageHeading").innerText = "Welcome Back!";
    document.getElementById("imageText").innerText = "Login to continue your journey with us.";
}