/* manageAdmins.js */

let pendingDemoteId   = null;   // UID of admin pending demotion
let pendingDemoteName = null;   // username for display in modal

/* ── Build one admin card ── */
function buildAdminCard(u) {
  const initial  = (u.username || 'A').charAt(0).toUpperCase();
  const name     = u.username    || '—';
  const cnic     = u.cnic        || '—';
  const email    = u.email       || '—';
  const phone    = u.phone       || '—';
  const dept     = u.department  || '—';
  const deptId   = u.dept_id     || '—';
  const uid      = u.uid;

  return `
    <div class="admin-card" id="admin-card-${uid}">

      <div class="admin-card-header">
        <div class="admin-avatar">${initial}</div>
        <div>
          <div class="admin-name">${name}</div>
          <span class="admin-dept-badge">
            <i class="fas fa-building"></i> ${dept}
          </span>
        </div>
      </div>

      <div class="admin-details">

        <div class="admin-detail-row">
          <div class="admin-detail-icon"><i class="fas fa-id-card"></i></div>
          <div class="admin-detail-content">
            <span class="admin-detail-label">CNIC</span>
            <span class="admin-detail-value">${cnic}</span>
          </div>
        </div>

        <div class="admin-detail-row">
          <div class="admin-detail-icon"><i class="fas fa-envelope"></i></div>
          <div class="admin-detail-content">
            <span class="admin-detail-label">Email</span>
            <span class="admin-detail-value">${email}</span>
          </div>
        </div>

        <div class="admin-detail-row">
          <div class="admin-detail-icon"><i class="fas fa-phone"></i></div>
          <div class="admin-detail-content">
            <span class="admin-detail-label">Phone</span>
            <span class="admin-detail-value">${phone}</span>
          </div>
        </div>

        <div class="admin-detail-row">
          <div class="admin-detail-icon"><i class="fas fa-hashtag"></i></div>
          <div class="admin-detail-content">
            <span class="admin-detail-label">Department ID</span>
            <span class="admin-detail-value">
              <span class="dept-id-pill">#${deptId}</span>
            </span>
          </div>
        </div>

      </div>

      <div class="admin-card-footer">
        <button class="btn-demote"
                id="demote-btn-${uid}"
                onclick="openDemoteModal('${uid}', '${name.replace(/'/g, "\\'")}')">
          <i class="fas fa-user-minus"></i> Demote to Citizen
        </button>
      </div>

    </div>`;
}

/* ── Render all cards ── */
function renderAdmins(admins) {
  const grid  = document.getElementById('adminGrid');
  const badge = document.getElementById('adminCount');

  badge.textContent = `${admins.length} Admin${admins.length !== 1 ? 's' : ''}`;

  if (!admins || admins.length === 0) {
    grid.innerHTML = emptyHtml('No admins found.');
    return;
  }

  grid.innerHTML = admins.map(u => buildAdminCard(u)).join('');
}

/* ── Demote modal ── */
function openDemoteModal(uid, name) {
  pendingDemoteId   = uid;
  pendingDemoteName = name;
  document.getElementById('demoteTargetName').textContent = name;
  document.getElementById('demoteOverlay').classList.add('open');
}

function closeDemoteModal(e) {
  if (e.target === document.getElementById('demoteOverlay')) {
    closeDemoteModalDirect();
  }
}

function closeDemoteModalDirect() {
  document.getElementById('demoteOverlay').classList.remove('open');
  pendingDemoteId   = null;
  pendingDemoteName = null;
}

async function confirmDemote() {
  if (!pendingDemoteId) return;

  const btn = document.getElementById('confirmDemoteBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing…';

  try {
    const res  = await fetch(`/manage-admins/demote/${pendingDemoteId}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      showToast(`${pendingDemoteName} has been demoted to Citizen.`);

      /* Remove card from DOM */
      const card = document.getElementById(`admin-card-${pendingDemoteId}`);
      if (card) {
        card.style.opacity    = '0';
        card.style.transform  = 'scale(0.95)';
        card.style.transition = 'all 0.3s';
        setTimeout(() => {
          card.remove();
          /* Update count badge */
          const remaining = document.querySelectorAll('.admin-card').length;
          document.getElementById('adminCount').textContent =
            `${remaining} Admin${remaining !== 1 ? 's' : ''}`;
          if (remaining === 0) {
            document.getElementById('adminGrid').innerHTML = emptyHtml('No admins found.');
          }
        }, 300);
      }
    } else {
      showToast(data.error || 'Demotion failed.', '#f87171');
    }
  } catch (e) {
    showToast('Cannot connect to server.', '#f87171');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-minus"></i> Yes, Demote';
    closeDemoteModalDirect();
  }
}

/* ── Load admins from backend ── */
async function loadAdmins() {
  try {
    const res  = await fetch('/manage-admins/list');
    const data = await res.json();

    if (!data.success) {
      document.getElementById('adminGrid').innerHTML =
        emptyHtml(data.error || 'Failed to load admins.');
      return;
    }

    renderAdmins(data.admins || []);

  } catch (e) {
    document.getElementById('adminGrid').innerHTML =
      emptyHtml('Cannot connect to server.');
  }
}

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDemoteModalDirect();
});

document.addEventListener('DOMContentLoaded', loadAdmins);
