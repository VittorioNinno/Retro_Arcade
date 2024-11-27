// Seleziona l'elemento toggle per il tema
const toggleSwitch = document.getElementById('theme-checkbox');

// Funzione per applicare il tema corrente
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Event listener per il toggle switch
toggleSwitch.addEventListener('change', function (e) {
    if (e.target.checked) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
}, false);

// All'avvio, controlla la preferenza di tema salvata
window.addEventListener('DOMContentLoaded', () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);
    toggleSwitch.checked = currentTheme === 'dark';
});