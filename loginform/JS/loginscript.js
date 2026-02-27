
// Get form and inputs
const form = document.getElementById("form-box");
const userMail = document.getElementById("email");
const passCode = document.getElementById("passcode");


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

        // Extract role and other info from token
        const decodedToken = decodeToken(data.token);
        let userRole = decodedToken ? decodedToken.role : null;
        let userId = decodedToken ? decodedToken.id : null;
        let userName = decodedToken ? decodedToken.name : null;

        // Store role and name
        if (userRole) localStorage.setItem("userRole", userRole);
        if (userName) localStorage.setItem("userName", userName);

        // Fetch user details to get branch info
        if (userId) {
          try {
            const userResponse = await fetch(`http://localhost:3000/users/${userId}`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${data.token}`,
                "Content-Type": "application/json"
              }
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.branch) {
                localStorage.setItem("userBranch", userData.branch);
                console.log("User branch stored:", userData.branch);
              }
            }
          } catch (error) {
            console.error("Error fetching user branch:", error);
            // Continue anyway, branch might be optional
          }
        }

        alert("Login successful!");

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