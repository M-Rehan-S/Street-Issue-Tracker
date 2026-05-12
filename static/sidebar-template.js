/* sidebar-template.js */

function getSidebarHTML(activePage, role) {
  const isSuperAdmin = (role || '').toLowerCase() === 'superadmin';
  const isAdmin = (role || '').toLowerCase() === 'admin';
  const isPrivileged = isSuperAdmin || isAdmin;   // admin + superadmin see inspection page

  return `
    <div class="sidebar-brand">
      <div class="brand-icon"><i class="fas fa-road"></i></div>
      <h1>Street Issue<br>Tracker</h1>
    </div>

    <div class="sidebar-nav">
      <a href="/dashboard" ${activePage === 'dashboard' ? 'class="active"' : ''}>
        <i class="fas fa-gauge-high"></i> Dashboard
      </a>
      <a href="/report-issue" ${activePage === 'report' ? 'class="active"' : ''}>
        <i class="fas fa-triangle-exclamation"></i> Report an Issue
      </a>
      <a href="/all-reports" ${activePage === 'all-reports' ? 'class="active"' : ''}>
        <i class="fas fa-list-check"></i> All Reports
      </a>
      <a href="/resolved" ${activePage === 'resolved' ? 'class="active"' : ''}>
        <i class="fas fa-circle-check"></i> Resolved Issues
      </a>
      ${isPrivileged ? `
      <a href="/inspection" ${activePage === 'inspection' ? 'class="active"' : ''}>
        <i class="fas fa-microscope"></i> AI Inspection Queue
      </a>` : ''}

      ${isSuperAdmin ? `
      <a href="/add-member" ${activePage === 'add-member' ? 'class="active"' : ''}>
        <i class="fas fa-user-plus"></i> Add Member
      </a>
      <a href="/manage-admins" ${activePage === 'manage-admins' ? 'class="active"' : ''}>
        <i class="fas fa-users-gear"></i> Manage Admins
      </a>` : ''}
    </div>

    <div style="border-top:1px solid hsla(0,0%,100%,0.06);padding-top:12px;">
      <div class="sidebar-nav" style="padding:0;">
        <a href="/settings" ${activePage === 'settings' ? 'class="active"' : ''}>
          <i class="fas fa-gear"></i> Settings
        </a>
        <a href="/logout" style="color:#f87171;">
          <i class="fas fa-right-from-bracket"></i> Logout
        </a>
      </div>
    </div>

    <div class="sidebar-bottom">
      <div class="profile-pic" id="profilePic">U</div>
      <div class="profile-info">
        <div class="p-name" id="profileName">Loading…</div>
        <div class="p-role" id="profileRole">....</div>
      </div>
    </div>
  `;
}

/* ── Mobile topbar HTML ── */
function getMobileTopbarHTML(username) {
  return `
    <div class="topbar-brand">
      <div class="topbar-brand-icon"><i class="fas fa-road"></i></div>
      <div class="topbar-brand-name">Street Issue<br>Tracker</div>
    </div>
    <button id="hamburger-btn" aria-label="Toggle menu" onclick="toggleSidebar()">
      <span></span>
      <span></span>
      <span></span>
    </button>
  `;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  const isOpen = sidebar.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  overlay.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('hamburger-btn');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

function bindSidebarNavLinks() {
  document.querySelectorAll('#sidebar .sidebar-nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const page = sidebar.dataset.page;
  const username = sidebar.dataset.username || 'User';
  const role = sidebar.dataset.role || 'Citizen';

  sidebar.innerHTML = getSidebarHTML(page, role);

  document.getElementById('profileName').innerText = username;
  document.getElementById('profileRole').innerText = role;
  document.getElementById('profilePic').innerText = username.charAt(0).toUpperCase();

  const roleLower = role.toLowerCase();
  if (roleLower === 'superadmin') {
    document.getElementById('profileRole').style.color = '#f97316';
  } else if (roleLower === 'admin') {
    document.getElementById('profileRole').style.color = '#facc15';
  }

  /* Inject mobile topbar */
  const topbar = document.createElement('div');
  topbar.id = 'mobile-topbar';
  topbar.innerHTML = getMobileTopbarHTML(username);
  document.body.prepend(topbar);

  /* Inject dark overlay */
  const overlay = document.createElement('div');
  overlay.id = 'sidebar-overlay';
  overlay.addEventListener('click', closeSidebar);
  document.body.appendChild(overlay);

  bindSidebarNavLinks();
});
