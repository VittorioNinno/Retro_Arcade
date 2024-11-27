// Seleziona gli elementi DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const restartButton = document.getElementById('restartButton');
const gameOverMessage = document.getElementById('gameOverMessage');

const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;

// Variabili per la velocità
let gameSpeed = 10; // Velocità del gioco variabile
let maxGameSpeed = 35; // Velocità massima consentita

const speedIncreaseInterval = 5; // Aumenta la velocità ogni 5 segmenti
const speedIncreaseAmount = 1; // Quantità di aumento della velocità

// Variabili per l'effetto ripple
const rippleDuration = 500; // Durata dell'effetto ripple in millisecondi

// Variabili per l'effetto di esplosione
let explosionActive = false;
const explosionDuration = 150; // Durata dell'effetto di esplosione in millisecondi

// Variabile per tenere traccia della difficoltà corrente
let currentDifficulty = 'medium'; // Valore predefinito

// Variabile per gli ostacoli (muri)
let obstacles = []; // Array per gli ostacoli

let snake = [];
let snakeDirection = { x: 0, y: 0 };
let food = {};
let score = 0;
let gameOver = false;
let lastRenderTime = 0;

// Coda per le direzioni
let directionQueue = [];

// Inizializza il gioco
function initializeGame(selectedDifficulty) {
    currentDifficulty = selectedDifficulty; // Imposta la difficoltà corrente

    // Imposta la velocità del gioco e la velocità massima in base alla difficoltà selezionata
    switch (selectedDifficulty) {
        case 'easy':
            gameSpeed = 7;
            maxGameSpeed = 25;
            break;
        case 'medium':
            gameSpeed = 10;
            maxGameSpeed = 35;
            break;
        case 'hard':
            gameSpeed = 15;
            maxGameSpeed = Infinity; // Senza limite
            break;
        default:
            gameSpeed = 10;
            maxGameSpeed = 35;
    }

    // Crea il serpente iniziale con una testa e un corpo di lunghezza tre
    const initialX = Math.floor(tileCountX / 2);
    const initialY = Math.floor(tileCountY / 2);
    snake = [
        { x: initialX, y: initialY }, // Testa del serpente
        { x: initialX - 1, y: initialY }, // Primo segmento del corpo
        { x: initialX - 2, y: initialY }  // Secondo segmento del corpo
    ];

    snakeDirection = { x: 1, y: 0 }; // Il serpente inizia muovendosi a destra
    score = 0;
    gameOver = false;
    explosionActive = false;
    directionQueue = []; // Reset della coda
    scoreElement.textContent = score;
    restartButton.style.display = "none";
    gameOverMessage.style.display = "none";
    document.addEventListener('keydown', changeDirection);
    lastRenderTime = 0; // Reset del tempo dell'ultimo render

    // Disabilita lo scroll all'inizio del gioco
    document.body.style.overflow = 'hidden';

    // Gestione degli ostacoli in base alla difficoltà
    if (currentDifficulty === 'medium') {
        generateHorizontalWalls();
    } else if (currentDifficulty === 'hard') {
        generateAllWalls();
    } else {
        obstacles = []; // Nessun ostacolo in Easy
    }

    // Genera il cibo dopo aver creato gli ostacoli
    food = getRandomFoodPosition();

    window.requestAnimationFrame(gameLoop);
}

// Genera muri orizzontali (superiore e inferiore) per modalità Medium
function generateHorizontalWalls() {
    obstacles = []; // Reset degli ostacoli

    // Muri superiori e inferiori
    for (let x = 0; x < tileCountX; x++) {
        obstacles.push({ x: x, y: 0 });
        obstacles.push({ x: x, y: tileCountY - 1 });
    }
}

// Genera muri su tutti i bordi per modalità Hard
function generateAllWalls() {
    obstacles = []; // Reset degli ostacoli

    // Muri superiori e inferiori
    for (let x = 0; x < tileCountX; x++) {
        obstacles.push({ x: x, y: 0 });
        obstacles.push({ x: x, y: tileCountY - 1 });
    }

    // Muri sinistro e destro
    for (let y = 1; y < tileCountY - 1; y++) { // Evita di duplicare gli angoli
        obstacles.push({ x: 0, y: y });
        obstacles.push({ x: tileCountX - 1, y: y });
    }
}

// Ciclo del gioco
function gameLoop(currentTime) {
    if (gameOver) {
        if (!explosionActive) return;
    }

    window.requestAnimationFrame(gameLoop);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / gameSpeed) return;

    lastRenderTime = currentTime;

    updateGame();
    drawGame();
}

// Aggiorna lo stato del gioco
function updateGame() {
    if (explosionActive) {
        updateExplosionEffect();
        return;
    }

    // Processa la coda di direzioni se disponibile
    if (directionQueue.length > 0) {
        const nextDirection = directionQueue.shift();

        // Verifica che la nuova direzione non sia l'opposto della direzione attuale
        if (!(nextDirection.x === -snakeDirection.x && nextDirection.y === -snakeDirection.y)) {
            snakeDirection = nextDirection;
        }
    }

    moveSnake();

    // Controlla se il serpente ha mangiato il cibo
    if (snake[0].x === food.x && snake[0].y === food.y) {
        score++;
        scoreElement.textContent = score;
        food = getRandomFoodPosition();

        // Attiva l'effetto ripple
        triggerRippleEffect();

        // Aumenta la velocità se la lunghezza del serpente è un multiplo di speedIncreaseInterval
        if ((snake.length % speedIncreaseInterval) === 0) {
            if (gameSpeed < maxGameSpeed) { // Solo se gameSpeed è inferiore a maxGameSpeed
                gameSpeed = Math.min(gameSpeed + speedIncreaseAmount, maxGameSpeed);
                console.log(`Velocità aumentata a: ${gameSpeed}`); // Log per debug
            }
        }
    } else {
        // Rimuove la coda se il serpente non ha mangiato
        snake.pop();
    }

    // Controlla per le collisioni
    checkSelfCollision();
    if (currentDifficulty === 'medium' || currentDifficulty === 'hard') {
        checkObstacleCollision();
    }
}

// Disegna il gioco
function drawGame() {
    // Pulisce il canvas
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-background');
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Disegna la griglia se in modalità easy
    if (currentDifficulty === 'easy') {
        drawGrid();
    }

    // Disegna il cibo
    if (!explosionActive) {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--food-color');
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
    }

    // Disegna gli ostacoli se in modalità Medium o Hard
    if (currentDifficulty === 'medium' || currentDifficulty === 'hard') {
        drawObstacles();
    }

    // Disegna il serpente
    const currentTime = Date.now();
    snake.forEach((part, index) => {
        let segmentColor;
        if (index === 0) {
            // Segmento della testa
            segmentColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-head-color');
        } else {
            // Segmenti del corpo
            segmentColor = getComputedStyle(document.documentElement).getPropertyValue('--snake-color');
        }

        let segmentSize = gridSize - 2;
        let x = part.x * gridSize;
        let y = part.y * gridSize;

        if (explosionActive && part.explosionStartTime) {
            // Effetto di esplosione
            const elapsed = currentTime - part.explosionStartTime;
            const progress = elapsed / explosionDuration;
            if (progress >= 0 && progress <= 1) {
                // Rimpicciolisce il segmento
                const scale = 1 - progress;
                segmentSize = (gridSize - 2) * scale;
                x = part.x * gridSize + (gridSize - segmentSize) / 2;
                y = part.y * gridSize + (gridSize - segmentSize) / 2;
            } else if (progress > 1) {
                // Segmento scomparso, rimuovilo dal serpente
                snake.splice(index, 1);
                return; // Salta il disegno di questo segmento
            }
        } else if (part.animationStartTime) {
            // Effetto ripple
            const elapsed = currentTime - part.animationStartTime;
            const progress = elapsed / rippleDuration;
            if (progress >= 0 && progress <= 1) {
                // Ingrandisce e rimpicciolisce usando una sinusoide
                const scale = 1 + 0.5 * Math.sin(progress * Math.PI);
                segmentSize = (gridSize - 2) * scale;
                x = part.x * gridSize + (gridSize - segmentSize) / 2;
                y = part.y * gridSize + (gridSize - segmentSize) / 2;
            } else if (progress > 1) {
                // Animazione terminata, rimuovi animationStartTime
                delete part.animationStartTime;
            }
        }

        ctx.fillStyle = segmentColor;
        ctx.fillRect(x, y, segmentSize, segmentSize);
    });

    // Se il serpente è completamente scomparso, mostra il messaggio di game over
    if (explosionActive && snake.length === 0) {
		explosionActive = false;
		gameOverMessage.textContent = 'GAME OVER!';
		gameOverMessage.style.display = 'block';
		restartButton.style.display = 'block';
		console.log(`Final Score: ${score}, Difficulty: ${currentDifficulty}`);
		checkAndAddScore(currentDifficulty, score); // Corretto da currentScore a score
	}
}

function moveSnake() {
    const newHead = { x: snake[0].x + snakeDirection.x, y: snake[0].y + snakeDirection.y };

    if (currentDifficulty === 'easy') {
        // Modalità Easy: wrapping in tutte le direzioni
        newHead.x = (newHead.x + tileCountX) % tileCountX;
        newHead.y = (newHead.y + tileCountY) % tileCountY;
    } else if (currentDifficulty === 'medium') {
        // Modalità Medium: wrapping solo sinistra-destra
        newHead.x = (newHead.x + tileCountX) % tileCountX;
        // y rimane invariato; collisione con muri gestita separatamente
    }
    // Modalità Hard: nessun wrapping; collisione con muri gestita separatamente

    // Aggiunge la nuova testa del serpente
    snake.unshift(newHead);
}

function changeDirection(event) {
    // Previene il comportamento predefinito (come lo scrolling) quando si premono i tasti freccia
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key.toLowerCase())) {
        event.preventDefault();
    }

    const keyPressed = event.key.toLowerCase();
    let newDirection;

    switch (keyPressed) {
        case 'arrowup':
        case 'w':
            newDirection = { x: 0, y: -1 };
            break;
        case 'arrowdown':
        case 's':
            newDirection = { x: 0, y: 1 };
            break;
        case 'arrowleft':
        case 'a':
            newDirection = { x: -1, y: 0 };
            break;
        case 'arrowright':
        case 'd':
            newDirection = { x: 1, y: 0 };
            break;
        default:
            return; // Ignora altri tasti
    }

    // Evita di aggiungere direzioni opposte immediate
    const lastDirection = directionQueue.length > 0 ? directionQueue[directionQueue.length - 1] : snakeDirection;
    if ((newDirection.x === -lastDirection.x && newDirection.y === 0) ||
        (newDirection.y === -lastDirection.y && newDirection.x === 0)) {
        return; // Ignora la direzione opposta
    }

    directionQueue.push(newDirection);
}

// Controlla se il serpente ha colliso con se stesso
function checkSelfCollision() {
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
            triggerExplosionEffect();
            break;
        }
    }
}

// Controlla se il serpente ha colliso con un ostacolo (solo in modalità Medium e Hard)
function checkObstacleCollision() {
    const head = snake[0];
    if (obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)) {
        triggerExplosionEffect();
    }
}

// Attiva l'effetto di esplosione
function triggerExplosionEffect() {
    gameOver = true;
    explosionActive = true;
    const currentTime = Date.now();
    snake.forEach((segment, index) => {
        segment.explosionStartTime = currentTime + index * 50; // Ritardo per ogni segmento
    });
    document.removeEventListener('keydown', changeDirection);

    // Abilita lo scroll al momento del game over
    document.body.style.overflow = 'auto';
}

// Aggiorna l'effetto di esplosione
function updateExplosionEffect() {
    // Nessuna logica aggiuntiva necessaria qui al momento
}

// Ottiene una posizione casuale per il cibo
function getRandomFoodPosition() {
    let newFoodPosition;
    while (
        !newFoodPosition ||
        snake.some(part => part.x === newFoodPosition.x && part.y === newFoodPosition.y) ||
        obstacles.some(obstacle => obstacle.x === newFoodPosition.x && obstacle.y === newFoodPosition.y)
    ) {
        newFoodPosition = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
    }
    return newFoodPosition;
}

// Riavvia il gioco
function restartGame(keepDifficulty = true) {
    const gameContainer = document.getElementById('gameContainer');
    const difficultyDiv = document.getElementById('difficultySelection');

    // Reimposta lo scroll durante il restart
    document.body.style.overflow = 'hidden';

    // Nascondi il messaggio di game over e il pulsante restart
    gameOverMessage.style.display = 'none';
    restartButton.style.display = 'none';

    if (keepDifficulty && currentDifficulty !== null) {
        // Se keepDifficulty è true, non mostrare la selezione della difficoltà e riavvia il gioco direttamente
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('visible');
        startGame(currentDifficulty);
    } else {
        // Nascondi il contenitore del gioco con animazione
        gameContainer.classList.remove('visible');
        gameContainer.classList.add('hidden');

        // Mostra la selezione della difficoltà con animazione dopo la transizione
        setTimeout(() => {
            gameContainer.style.display = 'none';
            difficultyDiv.style.display = 'flex';
            difficultyDiv.classList.remove('hidden');
            difficultyDiv.classList.add('visible');
        }, 500); // Deve corrispondere alla durata della transizione CSS
    }
}

// Avvia il gioco dopo aver selezionato la difficoltà
function startGame(selectedDifficulty) {
    const difficultyDiv = document.getElementById('difficultySelection');
    const gameContainer = document.getElementById('gameContainer');

    // Nascondi la selezione della difficoltà con animazione
    difficultyDiv.classList.remove('visible');
    difficultyDiv.classList.add('hidden');

    // Mostra il contenitore del gioco con animazione dopo la transizione
    setTimeout(() => {
        difficultyDiv.style.display = 'none';
        gameContainer.style.display = 'flex';
        gameContainer.classList.remove('hidden');
        gameContainer.classList.add('visible');
    }, 500); // Deve corrispondere alla durata della transizione CSS

    initializeGame(selectedDifficulty);
}

// Effetto ripple
function triggerRippleEffect() {
    const currentTime = Date.now();
    snake.forEach((segment, index) => {
        segment.animationStartTime = currentTime + index * 50; // Ritardo per ogni segmento
    });
}

// Disegna la griglia
function drawGrid() {
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color');
    ctx.lineWidth = 1.5; // Spessore della linea della griglia
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Disegna gli ostacoli (solo in modalità Medium e Hard)
function drawObstacles() {
    const obstacleFillColor = getComputedStyle(document.documentElement).getPropertyValue('--obstacle-color').trim();
    const obstacleBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--obstacle-border-color').trim();
    const obstacleBorderWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--obstacle-border-width'));

    ctx.fillStyle = obstacleFillColor;
    ctx.strokeStyle = obstacleBorderColor;
    ctx.lineWidth = obstacleBorderWidth;

    obstacles.forEach(obstacle => {
        const x = obstacle.x * gridSize;
        const y = obstacle.y * gridSize;
        ctx.fillRect(x, y, gridSize, gridSize);
        ctx.strokeRect(x, y, gridSize, gridSize);
    });
}