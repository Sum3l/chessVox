import express from "express";
import path from "path";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(import.meta.dirname, "app/public")));
app.use("/assets", express.static(path.join(import.meta.dirname, "app/assets")));

app.use("/chessground", express.static(path.join(import.meta.dirname, "node_modules/@lichess-org/chessground")));
app.use("/chess.js", express.static(path.join(import.meta.dirname, "node_modules/chess.js/dist")));

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running at http://localhost:${PORT}`);

io.on('connection', (socket) => {
    const playerId = socket.handshake.auth.playerId;
    if (!playerId) {
        console.log("Rejected connection: Missing playerId");
        return socket.disconnect();
    }

    console.log(`Player connected! Socket ID: ${socket.id} Player ID: ${playerId}`);

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${playerId}`);
    });
});

server.listen(PORT, () => {
    console.log('Server running on http://localhost:3000');
});
// });