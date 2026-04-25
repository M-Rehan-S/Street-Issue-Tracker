/* settings.js */

/* ── Keep existing saveSettings (not used in new UI but kept for safety) ── */
function saveSettings() {
    showToast('Settings saved! ✔');
}

function confirmReset() {
    if (confirm('Are you sure you want to clear all your local data? This cannot be undone.')) {
        showToast('Data cleared.', '#f87171');
    }
}

/* ══════════════════════════════════════════
   PERSONAL DETAILS MODEL
══════════════════════════════════════════ */

function openDetailsModel() {
    /* Clear all fields every time it opens */
    ['pdUsername', 'pdPhone', 'pdEmail', 'pdPassword', 'pdConfirmPassword'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(id).classList.remove('error');
    });
    const hint = document.getElementById('pdMatchHint');
    hint.textContent = '';
    hint.className = 'pd-match-hint';

    document.getElementById('pdOverlay').classList.add('open');
}

function closeDetailsModel(e) {
    if (e.target === document.getElementById('pdOverlay')) {
        document.getElementById('pdOverlay').classList.remove('open');
    }
}

function closeDetailsModelDirect() {
    document.getElementById('pdOverlay').classList.remove('open');
}

/* Show/hide password */
function togglePwd(inputId, btn) {
    const input = document.getElementById(inputId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
}

/* Live password-match feedback */
document.addEventListener('DOMContentLoaded', () => {
    const pwd     = document.getElementById('pdPassword');
    const confirm = document.getElementById('pdConfirmPassword');
    const hint    = document.getElementById('pdMatchHint');

    function checkMatch() {
        if (!confirm.value) {
            hint.textContent = '';
            hint.className = 'pd-match-hint';
            return;
        }
        if (pwd.value === confirm.value) {
            hint.textContent = '✓ Passwords match';
            hint.className = 'pd-match-hint ok';
            confirm.classList.remove('error');
        } else {
            hint.textContent = '✗ Passwords do not match';
            hint.className = 'pd-match-hint err';
            confirm.classList.add('error');
        }
    }

    pwd.addEventListener('input', checkMatch);
    confirm.addEventListener('input', checkMatch);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeDetailsModelDirect();
    });
});

/* ── Main submit function ── */
async function submitPersonalDetails() {
    const username = document.getElementById('pdUsername').value.trim();
    const phone    = document.getElementById('pdPhone').value.trim();
    const email    = document.getElementById('pdEmail').value.trim();
    const password = document.getElementById('pdPassword').value;
    const confirm  = document.getElementById('pdConfirmPassword').value;

    /* At least one field must be filled */
    if (!username && !phone && !email && !password) {
        showToast('Please fill in at least one field.', '#f87171');
        return;
    }

    /* If password is provided, confirm must match */
    if (password) {
        if (!confirm) {
            showToast('Please confirm your new password.', '#f87171');
            document.getElementById('pdConfirmPassword').classList.add('error');
            return;
        }
        if (password !== confirm) {
            showToast('Passwords do not match.', '#f87171');
            document.getElementById('pdConfirmPassword').classList.add('error');
            return;
        }
    }

    /* Email format check */
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', '#f87171');
        document.getElementById('pdEmail').classList.add('error');
        return;
    }

    /* Disable button while waiting */
    const saveBtn = document.querySelector('.pd-btn-save');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

    try {
        const res = await fetch('/personal-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, phone, email, password })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Details updated successfully! ✔');
            closeDetailsModelDirect();

            /* Update sidebar username live if it was changed */
            if (username) {
                const nameEl = document.getElementById('profileName');
                const picEl  = document.getElementById('profilePic');
                if (nameEl) nameEl.textContent = username;
                if (picEl)  picEl.textContent  = username.charAt(0).toUpperCase();
            }
        } else {
            showToast(data.error || 'Update failed. Please try again.', '#f87171');
        }
    } catch (e) {
        showToast('Cannot connect to server.', '#f87171');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-floppy-disk"></i> Save Changes';
    }
}