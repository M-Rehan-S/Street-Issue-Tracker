/* leaderboard.js */

async function loadLeaderboard() {
    try {
        const res = await fetch(API + '/leaderboard');
        const data = await res.json();
        const list = document.getElementById('exchangeList');

        if (!data.leaderboard || data.leaderboard.length === 0) {
            list.innerHTML = emptyHtml('No community data yet. Be the first to report!');
            return;
        }

        list.innerHTML = data.leaderboard.map((u, i) => {
            const initials = (u.name || 'U')
                .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const rankClass = i < 3 ? ` rank-${i + 1}` : '';

            return `
        <div class="exchange-item${rankClass}">
          <div class="ex-rank">#${i + 1}</div>
          <div class="ex-avatar">${initials}</div>
          <div class="ex-info">
            <div class="ex-name">${u.name}</div>
            <div class="ex-sub">${u.reports_count} reports &nbsp;·&nbsp; ${u.fixed_count} fixed</div>
          </div>
          <div>
            <div class="ex-pts">${u.points}</div>
            <div class="ex-pts-label">pts</div>
          </div>
        </div>`;
        }).join('');

    } catch (e) {
        document.getElementById('exchangeList').innerHTML =
            emptyHtml('Could not connect to backend.');
    }
}

document.addEventListener('DOMContentLoaded', loadLeaderboard);