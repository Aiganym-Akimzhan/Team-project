function initNavbarEvents() {
  const loginBtn =
    document.querySelector(".nav-login-btn") ||
    document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeModal = document.getElementById("closeModal");

  if (loginBtn && loginModal) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loginModal.style.display = "block";
    });
  }

  if (closeModal && loginModal) {
    closeModal.addEventListener("click", () => {
      loginModal.style.display = "none";
    });
  }
}
