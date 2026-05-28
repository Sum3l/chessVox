import { init2PlayerGame } from "./chessScript.js";
import { backBtn } from "./styleScript.js";

export const onlineMode = document.querySelector("#online");
export const twoPlayersMode = document.querySelector("#twoPlayers");

export const modeSelector = document.querySelector("#modeSelector");
export const nameTag = document.querySelector("#name");

export const beforeBoardInit = () => {
    modeSelector.classList.add("hidden");
    nameTag.classList.add("hidden");
    backBtn.classList.remove("blocked");
};

onlineMode.addEventListener("click", () =>{
    onlineMode.classList.toggle("active");
    twoPlayersMode.classList.toggle("hidden");
});

twoPlayersMode.addEventListener("click", () =>{
    beforeBoardInit();
    init2PlayerGame();
});