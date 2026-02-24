// Function to decode JWT token
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
}

// Get form and inputs
const form = document.getElementById("form-box");
const userMail = document.getElementById("email");
const passCode = document.getElementById("passcode");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = userMail.value.trim();
    const password = passCode.value.trim();

    try {
        const response = await fetch("http://localhost:3000/users/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        // If login failed
        if (!response.ok) {
            alert(data.message || "Login failed");
            return;
        }

        // Store token
        localStorage.setItem("token", data.token);

        // Extract role from response or from token
        let userRole = data.role; // First, try to get role from response
        
        if (!userRole) {
            // If role is not in response, decode token and extract it
            const decodedToken = decodeToken(data.token);
            userRole = decodedToken ? decodedToken.role : null;
        }

        alert("Login successful!");

        // OPTIONAL: If backend also returns role separately
        // localStorage.setItem("role", userRole);

        // Redirect based on user role
        if (userRole === "Sales-agent") {
            window.location.href = "/Dashbord forms/html/sellersDashboard.html";
        } else if (userRole === "Manager") {
            window.location.href = "/Dashbord forms/html/managersDashboard.html";
        } else if (userRole === "Director") {
            window.location.href = "/Dashbord forms/DirectorsDashboard/directorsDashboard.html";
        } else {
            alert("Unknown user role: " + userRole + ". Please contact support.");
            console.error("Unknown role:", userRole);
        }
    

        // If backend returns ONLY token:
        // For now redirect to a general dashboard
        // window.location.href = "/Dashbord forms/html/dashboard.html";

    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Check server.");
    }
});