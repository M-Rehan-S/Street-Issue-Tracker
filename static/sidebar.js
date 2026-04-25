/* sidebar.js — shared sidebar logic */


/* Global session — populated after loadSidebarProfile resolves.
   Other page scripts can read window.currentUser.role to check permissions.
   Privileged roles: 'admin' | 'moderator'  */

function showToast(msg, color) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = color || '#22c55e';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function badgeHtml(status) {
  const cls = { Fixed: 'badge-fixed', Pending: 'badge-pending', Open: 'badge-open' };
  return `<span class="badge ${cls[status] || 'badge-open'}">${status || 'Open'}</span>`;
}

function emptyHtml(msg) {
  return `<div class="empty-state">
    <i class="fas fa-circle-check"></i>
    <p>${msg}</p>
  </div>`;
}

function isPrivileged() {
  return ['admin', 'moderator'].includes((window.currentUser.role || '').toLowerCase());
}

async function loadSidebarProfile() {
  try {
    const res = await fetch(API + '/dashboard');
    const d = await res.json();
    if (d.user) {
      window.currentUser = d.user;

      const nameEl = document.getElementById('profileName');
      const roleEl = document.getElementById('profileRole');
      const picEl  = document.getElementById('profilePic');
      if (nameEl) nameEl.textContent = d.user.name || 'User';
      if (roleEl) roleEl.textContent = d.user.role || 'Citizen Reporter';
      if (picEl) {
        const initials = (d.user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
        if (d.user.avatar_url) {
          picEl.innerHTML = `<img src="${d.user.avatar_url}" alt="Profile"/>`;
        } else {
          picEl.textContent = initials;
        }
      }

      /* Badge on sidebar for privileged users */
      if (isPrivileged()) {
        const roleEl2 = document.getElementById('profileRole');
        if (roleEl2) roleEl2.innerHTML =
          `<span style="color:var(--accent);font-weight:700">${d.user.role}</span>`;
      }
    }
  } catch(e) {
    // silently fail — sidebar still renders
  }
}

document.addEventListener('DOMContentLoaded', loadSidebarProfile);