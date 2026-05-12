/* inspection.js */

let allReports = [];   // all inspection-queue reports from DB
let pendingOverrideId = null;  // report ID waiting for confirmation

/* ── Build one card ── */
function buildCard(r) {
  const conf = r.AIConfidenceScore != null ? parseFloat(r.AIConfidenceScore).toFixed(1) : '—';
  const confNum = parseFloat(r.AIConfidenceScore) || 0;
  const label = r.AILabel || 'Unknown';
  const type = r.category || r.Category || '—';
  const loc = r.location || r.Location || '—';
  const date = r.CreatedAt || r.Date || '—';
  const imgSrc = r.image_url || r.ImageURL || null;

  const thumbHtml = imgSrc
    ? `<img class="insp-thumb" src="${imgSrc}" alt="Report photo" />`
    : `<div class="insp-thumb-placeholder"><i class="fas fa-image"></i></div>`;

  return `
    <div class="insp-card" id="insp-card-${r.id || r.RID || r.ReportID}">

      ${thumbHtml}

      <div class="insp-body">

        <div class="insp-problem-type">${type}</div>

        <div class="insp-ai-row">
          <span class="ai-label-badge">
            <i class="fas fa-robot"></i> ${label}
          </span>
        </div>

        <div class="conf-wrap">
          <div class="conf-header">
            <span class="conf-label-text">AI Confidence</span>
            <span class="conf-value">${conf}%</span>
          </div>
          <div class="conf-track">
            <div class="conf-fill" style="width:${Math.min(confNum, 100)}%"></div>
          </div>
        </div>

        <div class="insp-meta">
          <i class="fas fa-location-dot"></i> ${loc}
        </div>
        <div class="insp-meta">
          <i class="fas fa-calendar-days"></i> ${date}
        </div>

      </div>

      <div class="insp-footer">
        <button class="btn-override"
                id="override-btn-${r.id || r.RID || r.ReportID}"
                onclick="openOverrideModal('${r.id || r.RID || r.ReportID}')">
          <i class="fas fa-check-circle"></i> Override AI — Approve Report
        </button>
      </div>

    </div>`;
}

/* ── Render grid ── */
function renderGrid(reports) {
  const grid = document.getElementById('inspGrid');
  const meta = document.getElementById('resultsMeta');
  const badge = document.getElementById('inspCount');

  badge.textContent = `${reports.length} Pending`;

  if (!reports || reports.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1">${emptyHtml('No reports pending inspection. The AI queue is clear.')}</div>`;
    meta.innerHTML = '';
    return;
  }

  meta.innerHTML = `Showing <strong>${reports.length}</strong> report${reports.length !== 1 ? 's' : ''} flagged for human review`;
  grid.innerHTML = reports.map(r => buildCard(r)).join('');
}

/* ── Filters ── */
function applyFilters() {
  const cat = document.getElementById('filterCategory').value;
  const label = document.getElementById('filterLabel').value;

  let filtered = allReports;
  if (cat) filtered = filtered.filter(r => (r.category || r.Category) === cat);
  if (label) filtered = filtered.filter(r => (r.AILabel || '') === label);
  renderGrid(filtered);
}

function clearFilters() {
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterLabel').value = '';
  renderGrid(allReports);
}

/* ── Override modal ── */
function openOverrideModal(id) {
  pendingOverrideId = id;
  document.getElementById('overrideOverlay').classList.add('open');
}

function closeOverrideModal(e) {
  if (e.target === document.getElementById('overrideOverlay')) {
    closeOverrideModalDirect();
  }
}

function closeOverrideModalDirect() {
  document.getElementById('overrideOverlay').classList.remove('open');
  pendingOverrideId = null;
}

async function confirmOverride() {
  if (!pendingOverrideId) return;

  const btn = document.getElementById('confirmOverrideBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing…';

  try {
    const res = await fetch(`/inspection/override/${pendingOverrideId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.success) {
      showToast('Report approved and moved to All Reports!');

      /* Remove card from DOM without full reload */
      const card = document.getElementById(`insp-card-${pendingOverrideId}`);
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        card.style.transition = 'all 0.3s';
        setTimeout(() => {
          card.remove();
          /* Update allReports array */
          allReports = allReports.filter(r =>
            String(r.id || r.RID || r.ReportID) !== String(pendingOverrideId)
          );
          document.getElementById('inspCount').textContent = `${allReports.length} Pending`;
          if (allReports.length === 0) {
            document.getElementById('inspGrid').innerHTML =
              `<div style="grid-column:1/-1">${emptyHtml('No reports pending inspection. The AI queue is clear.')}</div>`;
            document.getElementById('resultsMeta').innerHTML = '';
          }
        }, 300);
      }
    } else {
      showToast(data.error || 'Override failed.', '#f87171');
    }
  } catch (e) {
    showToast('Cannot connect to server.', '#f87171');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Yes, Approve';
    closeOverrideModalDirect();
  }
}

/* ── Load reports from backend ── */
async function loadInspectionQueue() {
  try {
    const res = await fetch('/inspection/reports');
    const data = await res.json();
    if (!data.success) {
      document.getElementById('inspGrid').innerHTML =
        `<div style="grid-column:1/-1">${emptyHtml(data.error || 'Failed to load.')}</div>`;
      return;
    }

    allReports = data.reports || [];
    renderGrid(allReports);

  } catch (e) {
    document.getElementById('inspGrid').innerHTML =
      `<div style="grid-column:1/-1">${emptyHtml('Cannot connect to server.')}</div>`;
  }
}

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeOverrideModalDirect();
});

document.addEventListener('DOMContentLoaded', loadInspectionQueue);
