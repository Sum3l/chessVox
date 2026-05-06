import { Chessground } from "/chessground/dist/chessground.min.js";
import { Chess, SQUARES } from "/chess.js/esm/chess.js";

const board = document.getElementById("board");

const chess = new Chess();

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
            const move = chess.move({
                from: orig,
                to: dest,
                promotion: 'q' // Auto-promote to queen
            });

            if (move) {
                ground.set({
                    turnColor: chess.turn() === 'w' ? 'white' : 'black',
                    check: chess.inCheck(),
                    movable: {
                        color: chess.turn() === 'w' ? 'white' : 'black',
                        dests: toDests(chess)
                    }
                });
            }
        } catch (error) {
            console.error("Move rejected. Snapping back.");
            ground.set({ fen: chess.fen() });
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
});
ground.set({
    movable: { events: { after: playOtherSide(ground, chess) } }
});

// need checkmate and en-pessant (maybe other things too) pawn promotion