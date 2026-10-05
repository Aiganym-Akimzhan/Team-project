const userRows = document.getElementById("userRows");
const statusMessage = document.getElementById("status");

async function loadUsers() {
  try {
    const response = await fetch("/api/users");
    const users = await response.json();
    if (!response.ok) {
      console.error("Could not load movies.");
      return;
    }

    userRows.innerHTML = users
      .map(
        (user) =>
          ` <tr> <td>${user.id}</td> <td>${user.username}</td> <td>${user.email}</td> <td>${new Date(user.created_at).toLocaleDateString()}</td> <td> <button onclick="deleteUser(${user.id}, '${user.username}')"> Delete </button> </td> </tr> `,
      )
      .join("");
    statusMessage.textContent = `${users.length} users`;
  } catch (error) {
    statusMessage.textContent = error.message;
  }
}

async function deleteUser(id, username) {
  if (!confirm(`Delete ${username}'s account?`)) {
    return;
  }
  try {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Could not delete user.");
    }
    loadUsers();
  } catch (error) {
    statusMessage.textContent = error.message;
  }
}

document.addEventListener("auth-changed", (event) => {
  if (event.detail?.role === "admin") {
    loadUsers();
  } else {
    userRows.innerHTML = "";
    statusMessage.textContent = "Please log in as an administrator.";
  }
});
