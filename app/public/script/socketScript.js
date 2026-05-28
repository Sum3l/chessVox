import { io } from "/socket.io/socket.io.esm.min.js";
import { init1PlayerGame, updateBoard, destroyBoard, playOtherSide, toDests, ground, chess } from "./chessScript.js";
import { backBtn, restart, quit } from "./styleScript.js";
import { qrCode, link, waitFriend, waitConnection, waiting, endWaiting, createQRCode } from "./qrScript.js";
import { onlineMode, twoPlayersMode, modeSelector, nameTag, beforeBoardInit } from "./modeScript.js";

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
let socket = null;

const initSocket = () => {
    socket = io({ auth: { playerId: playerId } });

    socket.on('connect', () => {
        console.log(`Connected to server with Socket ID: ${socket.id}`);
    });

    socket.on("gameFormed", (gameData) => {
        const color = gameData.color;

        if (waitFriend.classList.contains("hidden"))
            endWaiting("connection", false);
        else if (waitConnection.classList.contains("hidden")) {
            // fade out 
            qrCode.firstChild.animateQRCode((targets, _x, _y, _count, entity) => ({
                targets,
                from: entity === 'module' ? Math.random() * 200 : 200,
                duration: 500,
                easing: 'cubic-bezier(.5,0,1,1)',
                web: {
                    opacity: [1, 0],
                    scale: [1, 1.1, 0.5],
                },
            }));
            setTimeout(() => endWaiting("friend", false), 800);
        }
        beforeBoardInit();
        init1PlayerGame(gameData.color);
        ground.set({
            movable: {
                events: {
                    after: (req, res) => {
                        const helper = playOtherSide(ground, chess);
                        helper(req, res);
                        console.log("moveMade");
                        socket.emit("moveMade", {
                            roomId: gameData.id,
                            move: chess.history({ verbose: true })[chess.history().length - 1].san,
                        });
                    }
                }
            }
        });
        // console.log(`game configuration ${gameData}`);
    });

    socket.on("moveReceived", ({ san, turn }) => {
        console.log("moveReceived");
        if (turn === ground.state.orientation) {
            chess.move(san);
            updateBoard();
            ground.set({
                movable: {
                    color: turn,
                    dests: toDests(chess),
                }
            });
        } else {
            ground.set({
                movable: {
                    color: null,
                    dests: toDests(chess),
                }
            });
        }
        console.log("Move played!", san);
    })

    socket.on("playerResigned", () => {
        ground.stop();
        // Trigger Player Resigned UI
        alert("Player Resigned!"); 
    });

    socket.on("gameError", (errorMessage) => {
        console.error(errorMessage);
    });
}

const roomId = window.location.pathname.substring(1);
if (roomId) {
    initSocket();
    waiting("connection");
    // backBtn.classList.remove("blocked");
    socket.emit('joinGame', { roomId });
}

document.querySelector("#findMatch").addEventListener("click", () => {
    initSocket();
    waiting("connection");
    socket.emit("FindMatch");
    console.log("searching for a match");
});

document.querySelector("#challengeFriend").addEventListener("click", () => {
    initSocket();
    waiting("connection");
    socket.emit("createGame", (response) => {
        if (response && response.roomId) {
            const url = `${window.location.origin}/${response.roomId}`
            qrCode.appendChild(createQRCode(url));
            link.value = url;
            endWaiting("connection");
            waiting("friend");
        }
    })
});

cancel.addEventListener("click", () => {
    if (waitFriend.classList.contains("hidden"))
        endWaiting("connection");
    else if (waitConnection.classList.contains("hidden")) {
        // fade out 
        qrCode.firstChild.animateQRCode((targets, _x, _y, _count, entity) => ({
            targets,
            from: entity === 'module' ? Math.random() * 200 : 200,
            duration: 500,
            easing: 'cubic-bezier(.5,0,1,1)',
            web: {
                opacity: [1, 0],
                scale: [1, 1.1, 0.5],
            },
        }));
        setTimeout(() => endWaiting("friend"), 800);
    }
    socket.disconnect();
});

restart.addEventListener("click", () => {
    if (!backBtn.classList.contains("blocked")) {
        if (onlineMode.classList.contains("active")) {
            destroyBoard();
            modeSelector.classList.remove("hidden");
            nameTag.classList.remove("hidden");
            setTimeout(() => backBtn.classList.add("blocked"), 1500);
            endWaiting();
            socket.emit("resigned");
            socket.disconnect();
        }
    }
});

quit.addEventListener("click", () => {
    if (!backBtn.classList.contains("blocked")) {
        if (onlineMode.classList.contains("active")) {
            onlineMode.classList.toggle("active");
            twoPlayersMode.classList.toggle("hidden");
            endWaiting();
            socket.emit("resigned");
            socket.disconnect();
        }
    }
});