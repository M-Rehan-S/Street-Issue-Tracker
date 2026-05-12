document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.auth-container');
    const toggleButtons = document.querySelectorAll('.toggle-form');
    const heading = document.querySelector('.welcome-heading');
    const message = document.querySelector('.welcome-message');

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            container.classList.toggle('sign-up-mode');

            if (container.classList.contains('sign-up-mode')) {
                heading.textContent = 'WELCOME TO STREET ISSUE TRACKER!';
                message.textContent = 'Making every road safer, one report at a time.';
            } else {
                heading.textContent = 'WELCOME BACK TO STREET ISSUE TRACKER!';
                message.textContent = 'Please Login to your account.';
            }
        });
    });

    const cnicInput = document.getElementById('cnic');
    if (cnicInput) formatCNIC(cnicInput);
    const phoneInput = document.getElementById('phone');
    if (phoneInput) formatPhone(phoneInput);
});

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
