document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('dark-mode');
    const body = document.body;

    // Carica lo stato iniziale
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    toggle.checked = isDarkMode;
    updateDarkMode();

    toggle.addEventListener('change', () => {
        localStorage.setItem('dark-mode', toggle.checked);
        updateDarkMode();
    });

    function updateDarkMode() {
        if (toggle.checked) {
            body.classList.add('dark');
        } else {
            body.classList.remove('dark');
        }
    }
});