// Shared admin login gate, used by admin.html and orders.html.
// NOTE: This is a static-site prototype. The password check happens entirely in the
// browser, so it only deters casual visitors — it is NOT secure against anyone who
// views the page source. For real protection, these pages need a server-side login.
// The password below is stored as a SHA-256 hash (not plaintext) so it isn't readable
// at a glance in the source, but it is still verifiable/bypassable client-side by anyone
// who inspects this file closely — hashing alone does not make this secure.
const ADMIN_PASSWORD_HASH = "2cdf34b1b113a1f17068230c0d2a0548882515c9a6b7373a6426577a3e887c00";
const ADMIN_SESSION_KEY = "goodaay_admin_session";

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

// Wires up the #admin-lock / #admin-panel / #admin-login-form markup shared by admin pages
function setupAdminLoginGate(onUnlock) {
  const lockScreen = document.getElementById("admin-lock");
  const panel = document.getElementById("admin-panel");
  const loginForm = document.getElementById("admin-login-form");
  const loginError = document.getElementById("admin-login-error");
  const logoutBtn = document.getElementById("admin-logout");

  function showPanel() {
    lockScreen.style.display = "none";
    panel.style.display = "block";
    onUnlock();
  }

  if (isAdminLoggedIn()) {
    showPanel();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = document.getElementById("admin-password").value;
    const hash = await sha256Hex(value);
    if (hash === ADMIN_PASSWORD_HASH) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      loginError.textContent = "";
      showPanel();
    } else {
      loginError.textContent = "Incorrect password. Try again.";
    }
  });

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    panel.style.display = "none";
    lockScreen.style.display = "block";
    loginForm.reset();
  });
}
