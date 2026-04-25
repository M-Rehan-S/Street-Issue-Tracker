const resAside = document.querySelector('.aside');
const navLinks = document.querySelector('.nav-links');

resAside.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    resAside.classList.toggle('active');
});
const buttons = document.querySelectorAll('.nav-links button');
buttons.forEach(button => {
    button.addEventListener('click', () => {
        buttons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});