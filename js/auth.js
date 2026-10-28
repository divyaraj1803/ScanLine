/* ==========================================================================
   SCANLINE — Auth Module
   Handles JWT token storage, user state, and nav UI updates
   ========================================================================== */

const AUTH_TOKEN_KEY = 'scanline_auth_token';

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function fetchCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { clearToken(); return null; }
    return await res.json();
  } catch {
    return null;
  }
}

function injectNavAuthUI(user) {
  // Find all nav-actions divs across pages
  const navActions = document.querySelectorAll('.nav-actions');
  navActions.forEach(el => {
    // Remove existing auth elements
    el.querySelectorAll('.nav-auth-btn, .nav-user-chip').forEach(e => e.remove());

    if (user) {
      const chip = document.createElement('div');
      chip.className = 'nav-user-chip';
      chip.innerHTML = `
        <i class="fa-solid fa-circle-user" style="color:var(--teal-glow);"></i>
        <span class="nav-user-name">${user.username}</span>
        <button class="nav-logout-btn" id="navLogoutBtn" title="Logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      `;
      el.appendChild(chip);
      document.getElementById('navLogoutBtn')?.addEventListener('click', logout);
    } else {
      const btn = document.createElement('a');
      btn.className = 'nav-auth-btn';
      btn.href = '/login.html';
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
      el.appendChild(btn);
    }
  });
}

async function logout() {
  clearToken();
  window.location.href = '/login.html';
}

// Auto-run on every page load
(async function initAuth() {
  const user = await fetchCurrentUser();
  injectNavAuthUI(user);
})();
