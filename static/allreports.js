/* allreports.js */

let allReports = [];    // full data from DB
let likedSet = new Set(JSON.parse(localStorage.getItem('likedReports') || '[]'));
let activeModalId = null;

// Function for fetching allreports

function getAllReports() {





}




/* ── Visibility score: VoteCount drive ranking ── */
function visibilityScore(r) {
  return (r.VoteCount || 0);
}

/* ── Compute max VoteCount across reports for bar scaling ── */
function maxLikes(reports) {
  return Math.max(1, ...reports.map(r => r.VoteCount || 0));
}

/* ── Build one card ── */
function buildCard(r, maxL) {
  const liked = likedSet.has(r.ReportID);
  const VoteCount = r.VoteCount || 0;
  const fillPct = Math.min(100, Math.round((VoteCount / maxL) * 100));
  const isHot = VoteCount > 0 && fillPct >= 60;
  const privUser = isPrivileged();

  /* Description fallback */
  const desc = r.Description || '';

  /* Image */
  const imgSection = r.ImageURL
    ? `<div class="card-img"><img src="${r.ImageURL}" alt="Issue photo"/></div>`
    : `<div class="card-img"><i class="fas fa-image"></i></div>`;

  /* Hot badge */
  const hotBadge = isHot
    ? `<div class="hot-badge"><i class="fas fa-fire"></i> Trending</div>`
    : '';

  /* Admin controls strip */
  const adminStrip = privUser ? `
    <div class="admin-controls visible">
      <span class="admin-label"><i class="fas fa-shield-halved"></i> Admin</span>
      <button class="btn-change-status" onclick="openModal('${r.ReportID}', '${(r.Category || 'Report').replace(/'/g, "\\'")}')">
        <i class="fas fa-pen"></i> Change Status
      </button>
    </div>` : '';

  return `
    <div class="report-card" id="card-${r.ReportID}">
      ${hotBadge}
      ${imgSection}
      <div class="card-body">
        <div class="card-top">
          <div>
            <div class="card-category">${r.Category || 'Issue'}</div>
            <div class="card-location"><i class="fas fa-location-dot"></i> ${r.location || '—'}</div>
          </div>
          ${badgeHtml(r.Status)}
        </div>
        ${desc ? `<div class="card-desc">${desc}</div>` : ''}
        <div class="card-meta">
          <span class="card-date"><i class="fas fa-calendar-days" style="margin-right:4px;opacity:.5"></i>${r.CreatedAt || '—'}</span>
        </div>
      </div>
      <div class="card-footer">
        <button
          class="like-btn ${liked ? 'liked' : ''}"
          id="like-${r.ReportID}"
          onclick="toggleLike('${r.ReportID}')">
          <i class="fas fa-thumbs-up"></i>
          <span id="likeCount-${r.ReportID}">${VoteCount}</span> Same issue
        </button>
        <div class="visibility-bar-wrap">
          <div class="visibility-label">Visibility</div>
          <div class="visibility-bar">
            <div class="visibility-fill" style="width:${fillPct}%"></div>
          </div>
        </div>
      </div>
      ${adminStrip}
    </div>`;
}

/* ── Render grid ── */
function renderGrid(reports) {
  const grid = document.getElementById('reportsGrid');
  const meta = document.getElementById('resultsMeta');
  console.log('Reports ki length : ', reports.length);
  if (!reports || reports.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1">${emptyHtml('No reports match your filters.')}</div>`;
    meta.innerHTML = '';
    return;
  }

  /* Sort descending by visibility (VoteCount) */
  const sorted = [...reports].sort((a, b) => visibilityScore(b) - visibilityScore(a));
  const ml = maxLikes(sorted);

  meta.innerHTML = `Showing <strong>${sorted.length}</strong> report${sorted.length !== 1 ? 's' : ''}, sorted by community visibility`;
  grid.innerHTML = sorted.map(r => buildCard(r, ml)).join('');
}

/* ── Like / upvote ── */
async function toggleLike(id) {
  const already = likedSet.has(id);
  const report = allReports.find(r => r.ReportID == id);
  if (!report) return;

  if (already) {
    likedSet.delete(id);
    report.VoteCount = Math.max(0, (report.VoteCount || 1) - 1);
  } else {
    likedSet.add(id);
    report.VoteCount = (report.VoteCount || 0) + 1;
  }

  /* Persist liked set locally */
  localStorage.setItem('likedReports', JSON.stringify([...likedSet]));

  /* Optimistic UI update */
  const btn = document.getElementById(`like-${id}`);
  const countEl = document.getElementById(`likeCount-${id}`);
  if (btn) btn.classList.toggle('liked', !already);
  if (countEl) countEl.textContent = report.VoteCount;

  /* Re-render to reorder and refresh visibility bars */
  applyFilters();

  /* POST to backend */
  try {
    await fetch(`${API}/report/${id}/like`, {
      method: already ? 'DELETE' : 'POST'
    });
  } catch (e) { /* offline — local state already updated */ }
}

/* ── Filters ── */
function applyFilters() {
  const cat = document.getElementById('filterCategory').value;
  const stat = document.getElementById('filterStatus').value;

  let filtered = allReports;
  if (cat) filtered = filtered.filter(r => r.Category === cat);
  if (stat) filtered = filtered.filter(r => (r.Status || 'Open') === stat);

  renderGrid(filtered);
}

function clearFilters() {
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterStatus').value = '';
  renderGrid(allReports);
}

function isPrivileged() {
  const sidebar = document.getElementById('sidebar')
  const role = sidebar ? sidebar.dataset.role : 'citizen';
  return role !== 'citizen';
}
/* ── Admin modal ── */
function openModal(id, categoryName) {
  if (!isPrivileged()) return;
  activeModalId = id;
  document.getElementById('modalReportTitle').textContent = `Report: ${categoryName}`;
  document.getElementById('statusModal').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('statusModal')) return;
  document.getElementById('statusModal').classList.remove('open');
  activeModalId = null;
}

async function setStatus(newStatus) {
  if (!activeModalId) return;
  const report = allReports.find(r => r.ReportID == activeModalId);
  if (!report) return;

  report.status = newStatus;

  /* Optimistic UI */
  applyFilters();
  document.getElementById('statusModal').classList.remove('open');
  showToast(`Status updated to "${newStatus}"`);

  /* PATCH to backend */
  try {
    await fetch(`${API}/report/${activeModalId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (e) { /* offline — local state already updated */ }

  activeModalId = null;
}

/* ── Load from DB ── */
async function loadAllReports() {
  try {
    const res = await fetch(API + '/reports');
    const data = await res.json();
    allReports = data.reports || [];
    renderGrid(allReports);
  } catch (e) {
    document.getElementById('reportsGrid').innerHTML =
      `<div style="grid-column:1/-1">${emptyHtml('Could not connect to backend. Please start the server.')}</div>`;
    document.getElementById('resultsMeta').innerHTML = '';
  }
}

/* Close modal on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('statusModal').classList.remove('open');
    activeModalId = null;
  }
});

document.addEventListener('DOMContentLoaded', loadAllReports);