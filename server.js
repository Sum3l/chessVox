import express from "express";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import crypto from "crypto";
import { Chess } from "chess.js";

// import QRCode from "qrcode";
// const url = `localhost:${PORT}`;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(import.meta.dirname, "app/public")));
app.use("/assets", express.static(path.join(import.meta.dirname, "app/assets")));

app.use("/chessground", express.static(path.join(import.meta.dirname, "node_modules/@lichess-org/chessground")));
app.use("/chess.js", express.static(path.join(import.meta.dirname, "node_modules/chess.js/dist")));
app.use("/@bitjson/qr-code", express.static(path.join(import.meta.dirname, "node_modules/@bitjson/qr-code")));

app.get("/*path", (req, res) => {
    res.sendFile(path.join(import.meta.dirname, "app/public/index.html"));
});

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running at http://localhost:${PORT}`);

const activeGames = new Map();
let waitingPlayers = [];

io.on('connection', (socket) => {
    const playerId = socket.handshake.auth.playerId;
    if (!playerId)
        return socket.disconnect();
    console.log(`Player connected: ${playerId}`);

    socket.on('FindMatch', () => {
        if (!waitingPlayers[playerId])
            waitingPlayers.push({ id: playerId, socket: socket });
        console.log(waitingPlayers.length);

        if (waitingPlayers.length >= 2) {
            const p1 = waitingPlayers.shift();
            const p2 = waitingPlayers.shift();

            const roomId = crypto.randomUUID();
            const newGame = {
                id: roomId,
                white: p1,
                black: p2,
                chess: new Chess(),
            };
            activeGames.set(roomId, newGame);

            p1.socket.join(roomId);
            p2.socket.join(roomId);
            p1.socket.emit('gameFormed', {
                id: roomId,
                color: "white",
                chess: newGame.chess.fen(),
            });
            p2.socket.emit('gameFormed', {
                id: roomId,
                color: "black",
                chess: newGame.chess.fen(),
            });
            // io.to(roomId).emit('gameFormed', {
            //     id: roomId,
            //     white: p1.playerId,
            //     black: p2.playerId,
            //     chess: newGame.chess.fen(),
            // });
            console.log(`game started in room: ${roomId}`);
        }

    });

    socket.on('createGame', (callback) => {
        const roomId = crypto.randomUUID();
        const newGame = {
            id: roomId,
            white: { id: playerId, socket: socket },
            black: null,
            chess: new Chess(),
        };
        activeGames.set(roomId, newGame);
        socket.join(roomId);
        console.log(`Game created: ${roomId} by ${playerId}`);
        callback({ roomId });

        // QRCode.toDataURL(`${url}/${roomId}`)
        //     .then(qr => {
        //         socket.join(roomId);
        //         console.log(`Game created: ${roomId} by ${playerId}`);
        //         callback({ url: `${url}/${roomId}`, qr: qr });
        //     })
        //     .catch(err => {
        //         console.error(err)
        //     })
    });

    socket.on('joinGame', ({ roomId }) => {
        const game = activeGames.get(roomId);
        // console.log("game :",game);
        if (!game)
            return socket.emit('gameError', "game doesn't exist.");
        // console.log("game :",game);
        if (game.black && game.white.id !== playerId && game.black.id !== playerId)
            return socket.emit('gameError', 'game already full.');

        if (!game.black && game.white.id !== playerId)
            game.black = { id: playerId, socket: socket };

        socket.join(roomId);
        console.log(`player ${playerId} joined room ${roomId}`);

        if (game.white && game.black) {
            game.white.socket.emit('gameFormed', {
                id: roomId,
                color: "white",
                chess: game.chess.fen(),
            });
            socket.emit('gameFormed', {
                id: roomId,
                color: "black",
                chess: game.chess.fen(),
            });
        }
        // if (game.white && game.black)
        //     io.to(roomId).emit('gameFormed', {
        //         id: roomId,
        //         white: p1.playerId,
        //         black: p2.playerId,
        //         chess: game.chess.fen(),
        //     });
    });

    socket.on('disconnect', () => {
        waitingPlayers = waitingPlayers.filter(p => p.id !== playerId);
        console.log(`Player disconnected: ${playerId}`);
    });
});

server.listen(PORT, () => {
    console.log('Server running on http://localhost:3000');
});