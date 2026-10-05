const registerForm = document.getElementById("form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const message = document.getElementById("message");
const submitButton = registerForm.querySelector('button[type="submit"]');

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";

  const username = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (username.length < 2) {
    message.style.color = "#ff6b6b";
    message.textContent = "Enter a name with at least 2 characters.";
    return;
  }
  if (password.length < 8) {
    message.style.color = "#ff6b6b";
    message.textContent = "Use a password with at least 8 characters.";
    return;
  }
  if (confirmInput.value !== password) {
    message.style.color = "#ff6b6b";
    message.textContent = "The passwords do not match.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creating account…";
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Could not create your account.");

    message.style.color = "#6be08a";
    message.textContent = "Account created successfully";
    setTimeout(() => {
      window.location.href = "/";
    }, 900);
  } catch (error) {
    message.style.color = "#ff6b6b";
    message.textContent = error.message || "Could not reach the server";
  }
});
