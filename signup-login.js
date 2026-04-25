document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.auth-container');
    const toggleButtons = document.querySelectorAll('.toggle-form');
    const heading = document.querySelector(".welcome-heading");
    const message = document.querySelector(".welcome-message");

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();

            // Toggle the class
            container.classList.toggle('sign-up-mode');

            // Check the ACTUAL state of the UI
            if (container.classList.contains('sign-up-mode')) {
                // SIGN UP PAGE TEXT
                heading.textContent = "WELCOME TO STREET ISSUE TRACKER!";
                message.textContent = "Making every road safer, one report at a time.";
            } else {
                // LOGIN PAGE TEXT
                heading.textContent = "WELCOME BACK TO STREET ISSUE TRACKER!";
                message.textContent = "Please Login to your account."; // Reset the message!
            }
        });
    });
});