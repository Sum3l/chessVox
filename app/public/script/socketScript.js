import { io } from "/socket.io/socket.io.esm.min.js";
import { qrCode, link, waitFriend, waitConnection, waiting, endWaiting } from "./qrScript.js";
import { backBtn } from "./styleScript.js";
import { createQRCode } from "./qrScript.js";

// remove blocked from back when direct load 

// need to create better qr 
// copy text and link doesn't work


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
        if (waitConnection.classList.contains("hidden")) {
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

        console.log(`game configuration ${gameData}`);
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
