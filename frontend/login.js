let currentUser = null;
let currentRole = null;
const AUTH_STORAGE_KEY = "spirittv.auth";

function persistLogin() {
  if (!currentUser || !currentRole) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ user: currentUser, role: currentRole }),
  );
}

function updateNavigation() {
  const loginButton = document.getElementById("loginBtn");
  const usersLink = document.getElementById("usersNavLink");
  const moviePanel = document.getElementById("adminMoviePanel");

  if (loginButton) {
    if (currentUser) {
      const name = currentUser.username || currentUser.email || "User";

      loginButton.textContent = name;
    } else {
      loginButton.textContent = "LOGIN";
    }
  }

  if (usersLink) {
    usersLink.style.display = currentRole === "admin" ? "inline-block" : "none";
  }

  if (moviePanel) {
    moviePanel.style.display = currentRole === "admin" ? "block" : "none";
  }

  document.dispatchEvent(
    new CustomEvent("auth-changed", {
      detail: {
        user: currentUser,
        role: currentRole,
      },
    }),
  );
}

async function connectLogin() {
  const loginButton = document.getElementById("loginBtn");

  if (!loginButton) return;

  if (!document.getElementById("loginBox")) {
    const response = await fetch("/navbar/auth-modals.html");

    if (!response.ok) return;

    const html = await response.text();

    document.body.insertAdjacentHTML("beforeend", html);
  }

  const loginBox = document.getElementById("loginBox");
  const profileBox = document.getElementById("profileBox");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  loginButton.addEventListener("click", () => {
    if (currentUser) {
      showProfile();
    } else {
      loginBox.style.display = "flex";
      loginMessage.textContent = "";
      document.getElementById("loginName").focus();
    }
  });

  document.getElementById("loginClose").addEventListener("click", () => {
    loginBox.style.display = "none";
  });

  document.getElementById("profileClose").addEventListener("click", () => {
    profileBox.style.display = "none";
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: document.getElementById("loginName").value.trim(),
          password: document.getElementById("loginPassword").value,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      currentUser = result.user;
      currentRole = result.role;
      persistLogin();

      if (currentRole === "admin") {
        window.alert("Welcome admin!");
      }

      loginForm.reset();
      loginBox.style.display = "none";

      updateNavigation();
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });

  document
    .getElementById("profileForm")
    .addEventListener("submit", saveUsername);

  document.getElementById("logoutBtn").addEventListener("click", logOut);

  await restoreLogin();

  updateNavigation();
}

function showProfile() {
  document.getElementById("profileUsername").value = currentUser.username;

  document.getElementById("profileEmail").textContent =
    `${currentRole === "admin" ? "Administrator" : "User"} · ${currentUser.email}`;

  document.getElementById("profileMessage").textContent = "";

  document.getElementById("profileBox").style.display = "flex";
}

async function saveUsername(event) {
  event.preventDefault();

  const username = document.getElementById("profileUsername").value.trim();

  try {
    const response = await fetch("/api/account/username", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        userId: currentUser.id,
        role: currentRole,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Could not load movies.");
      return;
    }

    currentUser = result.user;
    persistLogin();

    document.getElementById("profileMessage").textContent = "Username updated.";

    updateNavigation();
  } catch (error) {
    document.getElementById("profileMessage").textContent = error.message;
  }
}

async function restoreLogin() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!saved) return;

    const result = JSON.parse(saved);
    if (!result.user || !["admin", "user"].includes(result.role)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    currentUser = result.user;
    currentRole = result.role;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    currentUser = null;
    currentRole = null;
  }
}

async function logOut() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  currentUser = null;
  currentRole = null;

  document.getElementById("profileBox").style.display = "none";

  updateNavigation();
}

document.addEventListener("navbar-ready", connectLogin);
