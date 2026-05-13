/* report.js */

/* ── Image upload handlers ─────────────────────────────────────────────── */

function handleUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('previewImg').src = e.target.result;
        };
        reader.readAsDataURL(file);

        document.getElementById('previewFilename').textContent = file.name;
        const kb = file.size / 1024;
        document.getElementById('previewFilesize').textContent = kb >= 1024
            ? (kb / 1024).toFixed(1) + ' MB'
            : Math.round(kb) + ' KB';

        document.getElementById('uploadArea').style.display   = 'none';
        document.getElementById('imagePreview').style.display = 'inline-flex';
    }
}

function removeImage() {
    document.getElementById('repImage').value                  = '';
    document.getElementById('previewImg').src                  = '';
    document.getElementById('previewFilename').textContent     = '';
    document.getElementById('previewFilesize').textContent     = '';
    document.getElementById('uploadArea').style.display        = 'flex';
    document.getElementById('imagePreview').style.display      = 'none';
}

/* ── Geolocation — returns a Promise ──────────────────────────────────── */

function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
            (err) => reject(err),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: Infinity }
        );
    });
}

/* ── Duplicate-report popup ────────────────────────────────────────────── */

/* Tracks which duplicate report IDs the user has already voted on
   inside this popup session (so the button toggles correctly) */
const dupVotedSet = new Set();

function buildDupCard(r) {
    const voted   = dupVotedSet.has(r.ReportID);
    const imgHtml = r.ImageURL
        ? `<img class="dup-card-img" src="${r.ImageURL}" alt="Report photo" />`
        : `<div class="dup-card-img dup-no-img"><i class="fas fa-image"></i></div>`;

    return `
    <div class="dup-card" id="dup-card-${r.ReportID}">
        ${imgHtml}
        <div class="dup-card-body">
            <div class="dup-card-category">${r.Category || '—'}</div>
            <div class="dup-card-location">
                <i class="fas fa-location-dot"></i> ${r.Location || '—'}
            </div>
            ${r.Description
                ? `<div class="dup-card-desc">${r.Description}</div>`
                : ''}
            <div class="dup-card-meta">
                <span><i class="fas fa-calendar-days"></i> ${r.CreatedAt || '—'}</span>
                <span id="dup-vote-count-${r.ReportID}">
                    <i class="fas fa-thumbs-up"></i> ${r.VoteCount || 0}
                </span>
            </div>
        </div>
        <div class="dup-card-footer">
            <button
                class="dup-vote-btn ${voted ? 'voted' : ''}"
                id="dup-vote-btn-${r.ReportID}"
                onclick="dupToggleVote('${r.ReportID}')">
                <i class="fas fa-thumbs-up"></i>
                ${voted ? 'Voted' : 'Same Issue — Upvote'}
            </button>
        </div>
    </div>`;
}

async function dupToggleVote(reportId) {
    const API    = getApi();
    const voted  = dupVotedSet.has(reportId);
    const method = voted ? 'DELETE' : 'POST';

    /* Optimistic UI */
    const btn      = document.getElementById(`dup-vote-btn-${reportId}`);
    const countEl  = document.getElementById(`dup-vote-count-${reportId}`);
    const current  = parseInt(countEl.textContent.replace(/\D/g, '')) || 0;

    if (voted) {
        dupVotedSet.delete(reportId);
        countEl.innerHTML = `<i class="fas fa-thumbs-up"></i> ${Math.max(0, current - 1)}`;
        btn.classList.remove('voted');
        btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Same Issue — Upvote';
    } else {
        dupVotedSet.add(reportId);
        countEl.innerHTML = `<i class="fas fa-thumbs-up"></i> ${current + 1}`;
        btn.classList.add('voted');
        btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Voted';
    }

    try {
        await fetch(`${API}/vote/${reportId}`, { method });
    } catch (e) {
        /* silent — optimistic state already applied */
    }
}

function openDupPopup(duplicates) {
    /* Build cards */
    document.getElementById('dupCardsContainer').innerHTML =
        duplicates.map(r => buildDupCard(r)).join('');

    /* Show count in header */
    const count = duplicates.length;
    document.getElementById('dupPopupCount').textContent =
        `${count} similar report${count !== 1 ? 's' : ''} found nearby`;

    /* Show popup */
    document.getElementById('dupPopupOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDupPopup(e) {
    /* Close only when clicking the dark backdrop, not the modal itself */
    if (e && e.target !== document.getElementById('dupPopupOverlay')) return;
    closeDupPopupDirect();
}

function closeDupPopupDirect() {
    document.getElementById('dupPopupOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

/* ── Submit report ─────────────────────────────────────────────────────── */

async function submitReport() {
    const location = document.getElementById('repLocation').value.trim();
    const category = document.getElementById('repCategory').value;
    const date     = document.getElementById('repDate').value;
    const desc     = document.getElementById('repDesc').value.trim();
    const imgFile  = document.getElementById('repImage').files[0];

    /* Validation — check all required fields first before asking for location */
    if (!location) {
        showToast('Please fill in Location.', '#f87171');
        return;
    }
    if (!category) {
        showToast('Please fill in Category.', '#f87171');
        return;
    }
    if (!imgFile) {
        showToast('Please add an image.', '#f87171');
        return;
    }

    /* Get location — show a friendlier error if denied */
    let lat, long;
    try {
        const coords = await getLocation();
        lat  = coords.lat;
        long = coords.long;
    } catch (e) {
        showToast('Location access denied. Please allow location and retry.', '#f87171');
        return;
    }

    const formData = new FormData();
    formData.append('location',    location);
    formData.append('category',    category);
    formData.append('date',        date);
    formData.append('description', desc);
    formData.append('image',       imgFile);
    formData.append('latitude',    lat);
    formData.append('longitude',   long);

    const API = getApi();

    /* Disable button while submitting */
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting…';

    try {
        const res  = await fetch(API + '/report', { method: 'POST', body: formData });
        const data = await res.json();

        /* ── Case 1: Nearby duplicates found ── */
        if (data.success && data.nearby_duplicates && data.nearby_duplicates.length > 0) {
            openDupPopup(data.nearby_duplicates);
            /* Do NOT reset the form — user may still want to submit after viewing */
            return;
        }

        /* ── Case 2: AI rejected (Normal image) ── */
        if (!data.success || data.label !== 'Pothole') {
            showToast(data.error || 'Image does not appear to show a pothole.', '#f87171');
            return;
        }

        /* ── Case 3: Successfully submitted ── */
        showToast('Report submitted successfully! 🎉');
        document.getElementById('repLocation').value = '';
        document.getElementById('repCategory').value = '';
        document.getElementById('repDate').value     = '';
        document.getElementById('repDesc').value     = '';
        removeImage();

    } catch (e) {
        showToast('Cannot connect to backend server.', '#f87171');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Report';
    }
}

/* ── Close popup on Escape ──────────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDupPopupDirect();
});

/* ── Set today's date as default ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('repDate').value = today;
});