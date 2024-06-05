document.addEventListener('DOMContentLoaded', () => {
    const titleScreen = document.getElementById('title-screen');
    const gameLobby = document.getElementById('game-lobby');
    const detailsScreen = document.getElementById('details-screen');
    const howToScreen = document.getElementById('how-to-screen');
    const gameScreen = document.getElementById('game-screen');

    const usernameInput = document.getElementById('username');
    const playBtn = document.getElementById('play-btn');
    const detailsBtn = document.getElementById('details-btn');
    const howToBtn = document.getElementById('how-to-btn');
    const backBtn = document.getElementById('back-btn');
    const backHowToBtn = document.getElementById('back-how-to-btn');

    const hostOptions = document.getElementById('host-options');
    const currPlayerLobby = document.getElementById('curr-player-lobby');
    const animeModeBtn = document.getElementById('anime-mode-btn');
    const pokemonModeBtn = document.getElementById('pokemon-mode-btn');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameModeDisplay = document.getElementById('game-mode');

    const currPlayer = document.getElementById('curr-player');
    const gameQuestion = document.getElementById('game-question');
    const gameAnswer = document.getElementById('game-answer');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');

    let isHost = false;
    let gameMode = 'None';
    let username = '';
    let correctAnswer = '';

    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        console.log('Connected to the server');
    };

    socket.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'host') {
            isHost = true;
            hostOptions.classList.remove('d-none');
            startGameBtn.classList.remove('d-none');
        } else if (message.type === 'gameMode') {
            gameMode = message.mode;
            gameModeDisplay.textContent = `Current Mode: ${gameMode}`;
        } else if (message.type === 'startGame') {
            await fetchQuestion();
        } else if (message.type === 'question') {
            gameLobby.classList.add('d-none');
            gameScreen.classList.remove('d-none');
            gameQuestion.textContent = message.question;
            correctAnswer = message.answer;
        } else if (message.type === 'result') {
            alert(`${message.result}, Correct answer is ${correctAnswer}`);
        } else if (message.type === 'gameDone') {
            alert(`Game done. The winner is ${message.winner}`);
            backToTitle();
        } else if (message.type === 'scoreUpdate') {
            players = message.players;
            updateScoreboard();
        }
    };

    playBtn.addEventListener('click', () => {
        username = usernameInput.value;
        currPlayerLobby.textContent = `Player Name: ${username}`;
        currPlayer.textContent = `Player Name: ${username}`;
        if (username) {
            titleScreen.classList.add('d-none');
            gameLobby.classList.remove('d-none');
            socket.send(JSON.stringify({ type: 'join', username }));
        } else {
            alert('Please enter a username.');
        }
    });

    detailsBtn.addEventListener('click', () => {
        titleScreen.classList.add('d-none');
        detailsScreen.classList.remove('d-none');
    });

    howToBtn.addEventListener('click', () => {
        titleScreen.classList.add('d-none');
        howToScreen.classList.remove('d-none');
    });

    backBtn.addEventListener('click', () => {
        detailsScreen.classList.add('d-none');
        titleScreen.classList.remove('d-none');
    });

    backHowToBtn.addEventListener('click', () => {
        howToScreen.classList.add('d-none');
        titleScreen.classList.remove('d-none');
    });

    animeModeBtn.addEventListener('click', () => {
        gameMode = 'Anime Guessing';
        socket.send(JSON.stringify({ type: 'gameMode', mode: gameMode }));
    });

    pokemonModeBtn.addEventListener('click', () => {
        gameMode = 'Pokemon Guessing';
        socket.send(JSON.stringify({ type: 'gameMode', mode: gameMode }));
    });

    startGameBtn.addEventListener('click', () => {
        gameLobby.classList.add('d-none');
        gameScreen.classList.remove('d-none');
        socket.send(JSON.stringify({ type: 'startGame', mode: gameMode }));
    });

    submitAnswerBtn.addEventListener('click', () => {
        const answer = gameAnswer.value.trim().toLowerCase();
        socket.send(JSON.stringify({ type: 'submitAnswer', answer, correctAnswer, username , mode : gameMode}));
        gameAnswer.value = '';
    });

    gameAnswer.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          document.getElementById("submit-answer-btn").click();
        }
    });
    
    async function backToTitle() {
        titleScreen.classList.remove('d-none');
        detailsScreen.classList.add('d-none');
        howToScreen.classList.add('d-none');
        gameLobby.classList.add('d-none');
        gameScreen.classList.add('d-none')
    }

    async function fetchQuestion() {
        if (gameMode === 'Anime Guessing') {
            const response = await axios.get('https://api.consumet.org/meta/anilist/random-anime');
            const anime = response.data;
            const question = `Guess the anime: ${anime.description}`;
            const answer = anime.title.romaji.toLowerCase();
            socket.send(JSON.stringify({ type: 'question', question, answer }));
        } else if (gameMode === 'Pokemon Guessing') {
            const randomId = Math.floor(Math.random() * 898) + 1;
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            const pokemon = response.data;
            const question = `Guess the Pokemon: ${pokemon.flavor_text_entries.find(entry => entry.language.name === 'en').flavor_text}`;
            const answer = pokemon.name.toLowerCase();
            socket.send(JSON.stringify({ type: 'question', question, answer }));
        }
    }

    function updateScoreboard() {
        scoreboard.innerHTML = '<h3>Scoreboard</h3>';
        for (const player in players) {
            const score = players[player];
            scoreboard.innerHTML += `<p>${player}: ${score}</p>`;
        }
    }
});
