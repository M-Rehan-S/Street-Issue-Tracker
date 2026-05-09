/* dash.js */

function issueHtml(r) {
    return `
    <div class="issue-info">
      <div class="issue-field"><span class="label">Location:</span> ${r.location || '—'}</div>
      <div class="issue-field"><span class="label">Category:</span> ${r.category || '—'}</div>
      <div class="issue-field"><span class="label">Status:</span> ${badgeHtml(r.status)}</div>
      <div class="issue-field"><span class="label">Date:</span> ${r.date || '—'}</div>
    </div>
    <div class="issue-img">
      ${r.image_url
            ? `<img src="${r.image_url}" alt="Issue photo"/>`
            : `<i class="fas fa-image" style="font-size:22px;opacity:.3"></i>`}
    </div>`;
}

async function loadDashboard() {
    const API = "http://127.0.0.1:5000";
    try {
        const res = await fetch(API + '/dashboard');
        const d = await res.json();

        // Stats
        const total = d.stats.total || 0;
        document.getElementById('statTotal').textContent = total;
        document.getElementById('statFixed').textContent = (d.stats.fixed || 0) + ' Fixed';
        document.getElementById('statPending').textContent = (d.stats.pending || 0) + ' Pending';
        document.getElementById('statOpen').textContent = d.stats.open || 0;
        const rate = total > 0 ? Math.round((d.stats.fixed / total) * 100) + '%' : '0%';
        document.getElementById('statRate').textContent = rate;

        // Recent report
        const rr = document.getElementById('recentReport');
        if (d.recent_report) {
            rr.innerHTML = `<div class="issue-card">${issueHtml(d.recent_report)}</div>`;
        } else {
            rr.innerHTML = emptyHtml('No recent reports. The streets are clean! 🎉');
        }

        // Slideshow
        const problems = (d.most_faced || []).slice(0, 7);
        const sc = document.getElementById('slideshowContainer');
        const sd = document.getElementById('slideDots');
        sc.innerHTML = '';
        sd.innerHTML = '';

        if (problems.length === 0) {
            sc.innerHTML = emptyHtml('No recurring problems found.');
        } else {
            problems.forEach((p, i) => {
                const slide = document.createElement('div');
                slide.className = 'slide' + (i === 0 ? ' active' : '');
                slide.innerHTML = issueHtml(p);
                sc.appendChild(slide);

                const dot = document.createElement('div');
                dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
                dot.onclick = () => goSlide(i);
                sd.appendChild(dot);
            });
            startSlideshow(problems.length);
        }

        // Your reports
        const yr = document.getElementById('yourReports');
        if (d.your_reports && d.your_reports.length > 0) {
            yr.innerHTML = d.your_reports.map(r =>
                `<div class="issue-card">${issueHtml(r)}</div>`
            ).join('');
        } else {
            yr.innerHTML = emptyHtml("You haven't reported any issues yet.");
        }

    } catch (e) {
        console.error(e);
        showDemoFallback();
    }
}

function showDemoFallback() {
    document.getElementById('statTotal').textContent = '0';
    document.getElementById('statFixed').textContent = '0 Fixed';
    document.getElementById('statPending').textContent = '0 Pending';
    document.getElementById('statOpen').textContent = '0';
    document.getElementById('statRate').textContent = '0%';
    document.getElementById('recentReport').innerHTML =
        emptyHtml('Backend not connected. Start the Flask server to load data.');
    document.getElementById('slideshowContainer').innerHTML =
        emptyHtml('No data available.');
    document.getElementById('yourReports').innerHTML =
        emptyHtml('No reports yet.');
}

let slideTimer = null;
let currentSlide = 0;

function startSlideshow(count) {
    clearInterval(slideTimer);
    currentSlide = 0;
    slideTimer = setInterval(() => {
        currentSlide = (currentSlide + 1) % count;
        goSlide(currentSlide);
    }, 5000);
}

function goSlide(idx) {
    document.querySelectorAll('.slide').forEach((s, i) => s.classList.toggle('active', i === idx));
    document.querySelectorAll('.slide-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
    currentSlide = idx;
}

document.addEventListener('DOMContentLoaded', loadDashboard);