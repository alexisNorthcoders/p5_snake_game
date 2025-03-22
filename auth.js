const API_URL = "http://raspberrypi.local:4123";

async function login(username, password) {

    if (!username && !password) {
        username = document.getElementById("username").value;
        password = document.getElementById("password").value;
    }

    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {

        const data = await response.json();
        const userData = {
            token: data.accessToken,
            username: username,
            userId: data.userId
        };
        
        localStorage.setItem("userData", JSON.stringify(userData));
        isLoggedIn = true
        
        connectWebSocket();
        document.getElementById("login-container").style.display = "none";
    } else {
        document.getElementById("error-msg").textContent = "Invalid credentials";
    }
}

async function anonymous() {
    const id = randomId()
    const userData = {
        token: 'no-token',
        username: `anon-${id}`,
        userId: id
    };
    
    localStorage.setItem("userData", JSON.stringify(userData));
    isLoggedIn = true
    
    connectWebSocket();
    document.getElementById("login-container").style.display = "none";

}

async function register() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        login(username, password);
    } else {
        alert("Failed to register. User may already exist.");
    }
}

async function logout() {

    const userData = JSON.parse(localStorage.getItem("userData"));

    await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${userData.token}`
        },
        body: JSON.stringify({ username: userData.username }),
    });

    localStorage.removeItem("userData");
    document.getElementById("snakeCanvas").style.display = "none";
}
