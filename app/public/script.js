import { io } from "/socket.io/socket.io.esm.min.js";

const getPlayerId = () => {
    let id = localStorage.getItem('chess_player_id');
    if (!id) {
        id = 'usr_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('chess_player_id', id);
    }
    return id;
}

const playerId = getPlayerId();
console.log(`Player ID is: ${playerId}`);

// Connect to the server
const socket = io({
    auth: {
        playerId: playerId,
    }
});

socket.on('connect', () => {
    console.log(`Connected to server with Socket ID: ${socket.id}`);
});
