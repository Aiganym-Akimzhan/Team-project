var loginBtn = document.getElementById("loginBtn");
var loginBox = document.getElementById("loginBox");
var loginForm = document.getElementById("loginForm");
var loginName = document.getElementById("loginName");
var loginPassword = document.getElementById("loginPassword");
var loginMessage = document.getElementById("loginMessage");

function closeLogin() {
  loginBox.style.display = "none";
}

loginBtn.onclick = function () {
  loginMessage.textContent = "";
  loginBox.style.display = "flex";
};

document.getElementById("loginClose").onclick = closeLogin;

loginBox.onclick = function (event) {
  if (event.target === loginBox) closeLogin();
};

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeLogin();
});

loginForm.onsubmit = function (event) {
  event.preventDefault();

  var name = loginName.value.trim();
  var password = loginPassword.value;

  if (name === "" || password === "") {
    loginMessage.style.color = "#ff6b6b";
    loginMessage.textContent = "Enter your username and password.";
    return;
  }

  loginMessage.style.color = "#6be08a";
  loginMessage.textContent = "Welcome, " + name + "!";
  loginForm.reset();

  setTimeout(function () {
    closeLogin();
    loginBtn.textContent = name;
  }, 1000);
};
