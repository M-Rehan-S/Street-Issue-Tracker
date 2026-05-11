/* sidebar-template.js */

function getSidebarHTML(activePage, role) {
  const isSuperAdmin = (role || '').toLowerCase() === 'superadmin'
  const isAdmin = (role || '').toLowerCase() === 'admin';

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
      <a href="/leaderboard" ${activePage === 'leaderboard' ? 'class="active"' : ''}>
        <i class="fas fa-trophy"></i> Community Board
      </a>
      ${isSuperAdmin ? `
      <a href="/add-member" ${activePage === 'add-member' ? 'class="active"' : ''}>
        <i class="fas fa-user-plus"></i> Add Member
      </a>` : ''}
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
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

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    const page = sidebar.dataset.page;
    const username = sidebar.dataset.username || 'User';
    const role = sidebar.dataset.role || 'Citizen';

    sidebar.innerHTML = getSidebarHTML(page, role);

    document.getElementById('profileName').innerText = username;
    document.getElementById('profileRole').innerText = role;
    document.getElementById('profilePic').innerText = username.charAt(0).toUpperCase();
  }
});
