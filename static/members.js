async function loadRoles() {
  const select = document.getElementById('amRole');
  const errorSpan = document.getElementById('rolesError');

  try {
    const res = await fetch('/get-roles');
    const data = await res.json();

    if (!data.success || !data.roles || data.roles.length === 0) {
      select.innerHTML = '<option value="">No Roles found in database</option>';
      errorSpan.style.display = 'flex';
      return;
    }

    select.innerHTML = '<option value="">Select Role</option>';
    data.roles.forEach(role => {
      const opt = document.createElement('option');
      opt.value = role.id;
      opt.textContent = role.name;
      select.appendChild(opt);
    });

  } catch (e) {
    select.innerHTML = '<option value="">Could not load departments</option>';
    errorSpan.style.display = 'flex';
  }
}

function generatePasscode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('amPasscode').value = pass;
}

async function addMember() {
  const username = document.getElementById('amUsername').value.trim();
  const cnic = document.getElementById('amCNIC').value.trim();
  const roleSelect = document.getElementById('amRole');
  const roleId = roleSelect.value;
  const roleName = roleSelect.options[roleSelect.selectedIndex].text;
  const passcode = document.getElementById('amPasscode').value.trim();
  const email = document.getElementById('amEmail').value.trim();
  const phoneNo = document.getElementById('amPhoneNo').value.trim();

  console.log({ username, cnic, roleId, passcode, email, phoneNo });
  if (!username) { showToast('Please enter a Username.', '#f87171'); return; }
  if (!cnic) { showToast('Please enter the CNIC.', '#f87171'); return; }
  if (!roleId) { showToast('Please select a Department.', '#f87171'); return; }
  if (!passcode) { showToast('Please generate a Passcode first.', '#f87171'); return; }
  if (!email) { showToast('Please enter a Email', '#f87171'); return; }
  if (!phoneNo) { showToast('Please enter a Phone Number', '#f87171'); return; }

  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering…';

  try {
    const res = await fetch('/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, cnic, role_name: roleName, passcode, email, phoneNo })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Member registered successfully!');

      document.getElementById('scUsername').textContent = username;
      document.getElementById('scCNIC').textContent = cnic;
      document.getElementById('scPasscode').textContent = passcode;
      document.getElementById('scRole').textContent = roleName;
      document.getElementById('scEmail').textContent = email;
      document.getElementById('scPhone').textContent = phoneNo
      document.getElementById('successCard').classList.add('show');

      /* Reset form */
      document.getElementById('amUsername').value = '';
      document.getElementById('amCNIC').value = '';
      document.getElementById('amRole').value = '';
      document.getElementById('amPasscode').value = '';
      document.getElementById('amEmail').value = '';
      document.getElementById('amPhoneNo').value = '';

    } else {
      showToast(data.error || 'Registration failed.', '#f87171');
    }
  } catch (e) {
    showToast('Cannot connect to server.', '#f87171');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-check"></i> Register Member';
  }
}

function copyText(id) {
  const val = document.getElementById(id).textContent;
  navigator.clipboard.writeText(val).then(() => showToast('Copied!'));
}

function showToast(msg, color) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = color || '#22c55e';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatCNIC(input) {
  input.addEventListener('input', function () {
    let digits = this.value.replace(/\D/g, '');
    if (digits.length > 13) digits = digits.slice(0, 13);
    let formatted = '';
    if (digits.length <= 5) {
      formatted = digits;
    } else if (digits.length <= 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    } else {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    }
    this.value = formatted;
  });
}

function formatPhone(input) {
  input.addEventListener('input', function () {
    let digits = this.value.replace(/\D/g, '');
    if (digits.length > 11) digits = digits.slice(0, 11);
    let formatted = '';
    if (digits.length <= 4) {
      formatted = digits;
    } else {
      formatted = digits.slice(0, 4) + '-' + digits.slice(4);
    }
    this.value = formatted;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadRoles();
  formatCNIC(document.getElementById('amCNIC'));
  formatPhone(document.getElementById('amPhoneNo'));
});
