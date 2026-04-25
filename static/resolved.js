/* resolved.js */

let resolvedReports = [];
let activeReportId = null;

/* ── Build resolved card ── */
function buildCard(r) {
    const desc = r.description || r.desc || '';

    const imgHtml = r.image_url
        ? `<img src="${r.image_url}" class="card-img-top-custom" alt="Issue photo"/>`
        : `<div class="card-img-placeholder"><i class="fas fa-image fa-2x" style="opacity:.2"></i></div>`;

    /* Check if proof exists locally */
    const proofUrl = localStorage.getItem(`proof_${r.id}`) || r.proof_image_url || '';

    return `
    <div class="col-md-6 col-lg-4 d-flex" id="col-${r.id}">
      <div class="report-card w-100" onclick="openDetail('${r.id}')">
        <div class="fixed-ribbon"><i class="fas fa-circle-check"></i> Fixed</div>
        ${imgHtml}
        <div class="card-body-custom">
          <div>
            <div class="card-category">${r.category || 'Issue'}</div>
            <div class="card-location"><i class="fas fa-location-dot"></i> ${r.location || '—'}</div>
          </div>
          ${desc ? `<div class="card-desc">${desc}</div>` : ''}
          <div class="d-flex align-items-center justify-content-between mt-auto">
            <span class="card-date"><i class="fas fa-calendar-days me-1" style="opacity:.5"></i>${r.date || '—'}</span>
            <span class="click-hint"><i class="fas fa-images"></i> See before &amp; after</span>
          </div>
        </div>
        <div class="card-footer-custom">
          <span class="proof-indicator">
            <i class="fas fa-camera"></i>
            ${proofUrl ? 'Proof uploaded' : 'No proof on file'}
          </span>
          <span style="font-size:12px;color:var(--text-muted)">${r.likes || 0} supported</span>
        </div>
      </div>
    </div>`;
}

function renderGrid(reports) {
    const grid = document.getElementById('resolvedGrid');
    const meta = document.getElementById('resultsMeta');
    const countBadge = document.getElementById('resolvedCount');

    countBadge.textContent = `${reports.length} Fixed`;

    if (!reports || reports.length === 0) {
        grid.innerHTML = `<div class="col-12"><div class="empty-state"><i class="fas fa-circle-check"></i><p>No resolved issues yet. Fixed reports will appear here.</p></div></div>`;
        meta.innerHTML = '';
        return;
    }

    /* Sort newest first (or by date desc) */
    const sorted = [...reports].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    meta.innerHTML = `Showing <strong>${sorted.length}</strong> resolved issue${sorted.length !== 1 ? 's' : ''}`;
    grid.innerHTML = sorted.map(r => buildCard(r)).join('');
}

/* ══════════ DETAIL DRAWER ══════════ */
function openDetail(id) {
    const r = resolvedReports.find(r => String(r.id) === String(id));
    if (!r) return;
    activeReportId = id;

    /* Before image (original report image) */
    const beforeEl = document.getElementById('drawerBefore');
    beforeEl.innerHTML = r.image_url
        ? `<img src="${r.image_url}" alt="Before"/>`
        : `<div class="ba-placeholder"><i class="fas fa-image fa-2x" style="opacity:.2"></i><small>No before photo</small></div>`;

    /* After image (proof) */
    const proofUrl = localStorage.getItem(`proof_${r.id}`) || r.proof_image_url || '';
    const afterEl = document.getElementById('drawerAfter');
    afterEl.innerHTML = proofUrl
        ? `<img src="${proofUrl}" alt="After — proof of fix"/>`
        : `<div class="ba-placeholder"><i class="fas fa-camera fa-2x" style="opacity:.2"></i><small>No after photo</small></div>`;

    /* Fields */
    document.getElementById('drawerTitle').textContent = r.category || 'Issue';
    document.getElementById('drawerLocation').innerHTML = `<i class="fas fa-location-dot me-1"></i>${r.location || '—'}`;
    document.getElementById('drawerReporter').textContent = r.reported_by || 'Anonymous';
    document.getElementById('drawerDate').textContent = r.date || '—';
    document.getElementById('drawerLikes').textContent = `${r.likes || 0} people reported this`;
    document.getElementById('drawerResolvedBy').textContent = r.resolved_by || 'Municipal Authority';
    document.getElementById('drawerDesc').textContent = r.description || r.desc || 'No description provided.';

    document.getElementById('detailOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDetail(e) {
    if (e && e.target !== document.getElementById('detailOverlay')) return;
    closeDetailDirect();
}
function closeDetailDirect() {
    document.getElementById('detailOverlay').classList.remove('open');
    document.body.style.overflow = '';
    activeReportId = null;
}

/* ── Filters ── */
function applyFilters() {
    const cat = document.getElementById('filterCategory').value;
    let filtered = resolvedReports;
    if (cat) filtered = filtered.filter(r => r.category === cat);
    renderGrid(filtered);
}

function clearFilters() {
    document.getElementById('filterCategory').value = '';
    renderGrid(resolvedReports);
}

/* ── Load ── */
async function loadResolved() {
    try {
        const res = await fetch(API + '/reports');
        const data = await res.json();
        /* Filter only Fixed reports */
        resolvedReports = (data.reports || []).filter(r => r.status === 'Fixed');
        renderGrid(resolvedReports);
    } catch (e) {
        document.getElementById('resolvedGrid').innerHTML =
            `<div class="col-12"><div class="empty-state"><i class="fas fa-server"></i><p>Could not connect to backend. Please start the server.</p></div></div>`;
    }
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetailDirect(); });
document.addEventListener('DOMContentLoaded', loadResolved);