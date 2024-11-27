document.addEventListener('DOMContentLoaded', () => {
    const leaderboardPopup = document.getElementById('leaderboardPopup');
    const leaderboardTable = document.querySelector('#leaderboardPopup tbody');
    const leaderboardTitle = document.querySelector('#leaderboardTitle');
    const closeLeaderboard = document.getElementById('closeLeaderboard');

    closeLeaderboard.addEventListener('click', () => {
        closePopup();
    });

    // Chiude la leaderboard al clic esterno
    document.addEventListener('click', (event) => {
        const isClickInside = leaderboardPopup.contains(event.target);

        if (!isClickInside && leaderboardPopup.classList.contains('show')) {
            closePopup();
        }
    });

    function closePopup() {
        leaderboardPopup.classList.remove('show');
        leaderboardPopup.classList.add('hide');

        // Aspetta la fine dell'animazione per nascondere il popup
        leaderboardPopup.addEventListener('animationend', () => {
            leaderboardPopup.classList.remove('hide');
            leaderboardPopup.style.display = 'none';
        }, { once: true });
    }

    function updateLeaderboard(difficulty, name, score) {
        const leaderboard = JSON.parse(localStorage.getItem(difficulty)) || [];
        
        // Aggiunge il nuovo punteggio e ordina la lista in modo discendente
        leaderboard.push({ name, score });
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Mantiene solo i migliori 5 punteggi
        if (leaderboard.length > 5) leaderboard.pop();
        
        localStorage.setItem(difficulty, JSON.stringify(leaderboard));
    }

    function checkAndAddScore(difficulty, score) {
        console.log(`Checking and adding score: ${score} for difficulty: ${difficulty}`);
        const leaderboard = JSON.parse(localStorage.getItem(difficulty)) || [];
        
        // Controlla se il punteggio è tra i primi 5 o se la leaderboard ha meno di 5 punteggi
        if (leaderboard.length < 5 || score > leaderboard[leaderboard.length - 1].score) {
            const name = prompt("Congratulations! Enter your name (3 characters):", "").substring(0, 3).toUpperCase();
            if (name) { // Aggiungi un controllo per evitare nomi vuoti
                updateLeaderboard(difficulty, name, score);
            }
            showLeaderboard(difficulty);
        } else {
            showLeaderboard(difficulty);
        }
    }

    window.showLeaderboard = function (difficulty) {
        leaderboardTitle.textContent = `LEADERBOARD [${difficulty.toUpperCase()}]`; // Titolo in maiuscolo
        const leaderboard = JSON.parse(localStorage.getItem(difficulty)) || [];
        
        leaderboardTable.innerHTML = leaderboard.map((entry, index) => {
            // Assegna classi speciali alle prime tre posizioni
            let className = '';
            if (index === 0) className = 'gold';
            else if (index === 1) className = 'silver';
            else if (index === 2) className = 'bronze';

            return `<tr class="${className}">
                        <td>${index + 1}</td>
                        <td>${entry.name}</td>
                        <td>${entry.score}</td>
                    </tr>`;
        }).join('');
        
        // Mostra con animazione
        leaderboardPopup.style.display = 'block';
        leaderboardPopup.classList.add('show');
    };

    window.updateLeaderboard = updateLeaderboard;
    window.checkAndAddScore = checkAndAddScore;
});