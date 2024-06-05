const express = require('express');
const WebSocket = require('ws');
const axios = require('axios');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8080;
let host = null;
let turn = 1;
let players = {};

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            if (host === null) {
                host = ws;
                ws.send(JSON.stringify({ type: 'host' }));
            }
            players[data.username] = 0;
            updateScores()
        } else if (data.type === 'gameMode') {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'gameMode', mode: data.mode }));
                }
            });
        } else if (data.type === 'startGame') {
            await startGame(data.mode);
        } else if (data.type === 'submitAnswer') {
            const correct = data.answer === data.correctAnswer;
            console.log(correct);
            if (turn === 10){
                let winner;
                let largest = 0;
                Object.entries(players).forEach(([key, value]) => {
                    if(value > largest){
                        winner = key;
                        largest = value;
                    }
                });
                console.log(winner)
                ws.send(JSON.stringify({ type: 'gameDone', winner:winner}));
                resetGame();
                return;
            } else if(correct){
                turn++;
                console.log(turn);
                updateScores();
                players[data.username] += 1;
                updateScores();
                await startGame(data.mode);
                console.log(players)
            }
            
            ws.send(JSON.stringify({ type: 'result', result: correct ? 'Correct!' : 'Wrong, try again!' }));
        }
    });

    ws.on('close', () => {
        if (ws === host) {
            host = null;
        }
    });
});

async function startGame(mode) {
    if (mode === 'Anime Guessing') {
        try {
            const response = await axios.get('https://api.jikan.moe/v4/random/anime');
            const anime = response.data.data;
            console.log(anime)
                const question = `Guess the anime: ${anime.synopsis}`;
                const answer = anime.title_english.toLowerCase();
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'question', question, answer }));
                    }
                });
        } catch (error) {
            if (error = 'Cannot read properties of null'){
                startGame("Anime Guessing")
            }
            console.error('Error fetching anime data:', error);
        }
    } else if (mode === 'Pokemon Guessing') {
        try {
            const randomId = Math.floor(Math.random() * 898) + 1;
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`);
            const pokemon = response.data;  
            if (pokemon && pokemon.flavor_text_entries) {
                const flavorTextEntry = pokemon.flavor_text_entries.find(entry => entry.language.name === 'en');
                if (flavorTextEntry) {
                    const question = `Guess the Pokemon: ${flavorTextEntry.flavor_text}`;
                    const answer = pokemon.name.toLowerCase();
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({ type: 'question', question, answer }));
                        }
                    });
                } else {
                    console.error('No English flavor text entry found');
                }
            } else {
                console.error('No Pokemon data or flavor text entries found');
            }
        } catch (error) {
            console.error('Error fetching Pokemon data:', error);
        }
    }
}

function updateScores() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'scoreUpdate', players }));
        }
    });
}

function resetGame() {
    players = {};
    currentQuestion = null;
    currentAnswer = null;
    updateScores();
    turn = 1;
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
