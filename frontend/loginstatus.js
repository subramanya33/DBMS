// Assuming you have a form with input fields for username and password
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');

// Assuming you have a login button triggering the login process
const loginButton = document.getElementById('login-button');
loginButton.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const userId = await getUserIdAfterLogin(username, password);
        if (userId) {
            // Store the user ID in a cookie after a successful login
            document.cookie = `userId=${userId}; path=/`;
            console.log('User ID:', userId);
            // Update login status and UI
            updateLoginStatus();
        } else {
            console.error('Failed to get user ID after login');
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
});

// Function to send login credentials to the backend and get user ID
async function getUserIdAfterLogin(username, password) {
    try {
        const response = await fetch('/frontend-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            return data.userId;
        } else {
            throw new Error('Failed to login');
        }
    } catch (error) {
        throw new Error('Failed to login: ' + error.message);
    }
}

// Function to update login status and UI
async function updateLoginStatus() {
    const userId = getCookie('userId');
    const serverLoggedInUser = await isLoggedIn();

    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');

    // Determine if the user is logged in based on both cookies and server-side session
    const userLoggedIn = userId || serverLoggedInUser;

    if (userLoggedIn) {
        loginLinks.forEach(link => link.style.display = 'none');
        logoutLinks.forEach(link => link.style.display = 'inline');
    } else {
        loginLinks.forEach(link => link.style.display = 'inline');
        logoutLinks.forEach(link => link.style.display = 'none');
    }
}

// Event listener for logout action
document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('logout-link')) {
        // Remove the userId cookie on logout
        document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        await updateLoginStatus();
    }
});

// Function to get a cookie by name
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.split('=');
        if (cookieName.trim() === name) {
            return cookieValue;
        }
    }
    return null;
}

// Function to check if the user is logged in based on server-side session
async function isLoggedIn() {
    try {
        const response = await fetch('/check-session');
        if (response.ok) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error checking session status:', error);
        return false;
    }
}

// Update login status when the page loads
window.addEventListener('DOMContentLoaded', updateLoginStatus);
