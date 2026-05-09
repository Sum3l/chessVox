import { Chessground } from "/chessground/dist/chessground.min.js";
import { Chess, SQUARES } from "/chess.js/esm/chess.js";

const board = document.querySelector("#board");
const promotionMenu = document.querySelector("#promotionMenu");
const promotionOptions = Array.from(promotionMenu.children);
let moveSpace = null;

const roleMap = {
    'q': 'queen',
    'r': 'rook',
    'b': 'bishop',
    'n': 'knight',
    'p': 'pawn',
    'k': 'king'
}

const chess = new Chess();

const updateBoard = () => {
    ground.set({
        fen: chess.fen(),
        turnColor: chess.turn() === 'w' ? 'white' : 'black',
        check: chess.inCheck(),
    });
    console.log(chess.fen());
    if (chess.isGameOver()) {
        if (chess.isCheckmate()) 
            // Trigger Checkmate UI (e.g., "White wins by checkmate!") 
            console.log("Checkmate!");
        else if (chess.isStalemate()) 
            // Trigger Stalemate UI (e.g., "Draw by stalemate.")
            console.log("Stalemate!");
        else if (chess.isThreefoldRepetition())
             // Trigger Repetition UI 
            console.log("Threefold Repetition!");
        else if (chess.isInsufficientMaterial())
            // Trigger Insufficient Material UI 
            console.log("Insufficient Material!");
        else if (chess.isDrawByFiftyMoves()) 
            // Trigger 50-move Rule Draw UI 
            console.log("50-move Rule Draw!");
            // Trigger Player Resigned UI
        else console.log("Player Resigned!");
        // Stop the user from making more moves
        // ground.set({ movable: { color: undefined } });
        ground.stop();
        return;
    }
    ground.set({
        movable: {
            color: chess.turn() === 'w' ? 'white' : 'black',
            dests: toDests(chess)
        }
    });
};

promotionOptions.forEach(option => {
    option.addEventListener("click", event => {
        const role = event.currentTarget.dataset.role;
        promotionMenu.classList.add("hidden");
        if (moveSpace) {
            chess.move({
                from: moveSpace.from,
                to: moveSpace.to,
                promotion: role,
            });
            updateBoard();
            moveSpace = null;
        }
    });
});

const promoteTo = (targetSquare, turnColor) => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileIndex = files.indexOf(targetSquare[0]);
    const left = fileIndex * 12.5;
    const top = turnColor === 'w' ? 0 : 50;

    promotionMenu.style.left = `${left}%`;
    promotionMenu.style.top = `${top}%`;

    promotionOptions.forEach(option => {
        const role = option.dataset.role;
        option.querySelector("piece").className = `${roleMap[role]} ${turnColor === 'w' ? 'white' : 'black'}`;
    });

    promotionMenu.classList.remove("hidden");
};

const toDests = (chess) => {
    const dests = new Map();
    SQUARES.forEach((square) => {
        const moves = chess.moves({ square, verbose: true });
        if (moves.length) {
            dests.set(square, moves.map((move) => move.to));
        }
    });
    return dests;
};

const playOtherSide = (ground, chess) => {
    return (orig, dest) => {
        try {
            const moves = chess.moves({ square: orig, verbose: true });
            const isPromotion = moves.some(move => move.to === dest && move.isPromotion());

            if (isPromotion) {
                moveSpace = { from: orig, to: dest };
                promoteTo(dest, chess.turn());
                return;
            } else {
                chess.move({
                    from: orig,
                    to: dest,
                    // promotion: 'q' // Auto-promote to queen
                });
                updateBoard();
            }
        } catch (error) {
            console.error(error);
            console.error("Move rejected. Snapping back.");
            ground.set({ fen: chess.fen() });
            chess.undo();
            // not tested
        }
    };
}

const ground = Chessground(board, {
    movable: {
        color: "white",
        free: false,
        dests: toDests(chess),
    },
    draggable: {
        showGhost: true,
    },
    premovable: {
        enabled: true,
    },
});
ground.set({
    movable: { events: { after: playOtherSide(ground, chess) } }
});

// future update: add preMove for 1 player
// --config premovable: { enabled: true }