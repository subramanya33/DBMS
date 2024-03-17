// Function to check login status and update UI
async function updateLoginStatus() {
    // Check if the user is logged in using both local storage and server-side sessions
    const localLoggedInUser = localStorage.getItem('loggedInUser');
    const serverLoggedInUser = await isLoggedIn(); // Await here

    // Get login/logout links
    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');

    // Determine if the user is logged in based on both local storage and server-side session
    const userLoggedIn = localLoggedInUser || serverLoggedInUser;

    if (userLoggedIn) {
        // If user is logged in, show logout links and hide login links
        loginLinks.forEach(link => link.style.display = 'none');
        logoutLinks.forEach(link => link.style.display = 'inline');
    } else {
        // If user is not logged in, show login links and hide logout links
        loginLinks.forEach(link => link.style.display = 'inline');
        logoutLinks.forEach(link => link.style.display = 'none');
    }
}

// Event listener for logout action
document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('logout-link')) {
        // Clear the logged-in user from local storage and update UI
        localStorage.removeItem('loggedInUser');
        await updateLoginStatus(); // Await here
    }
});

// Function to check if the user is logged in based on server-side session
async function isLoggedIn() {
    try {
        const response = await fetch('/check-session');
        if (response.ok) {
            return true;
        } else {
            // Handle non-OK responses here if needed
            return false;
        }
    } catch (error) {
        console.error('Error checking session status:', error);
        return false;
    }
}

// Update login status when the page loads
window.addEventListener('DOMContentLoaded', updateLoginStatus);
