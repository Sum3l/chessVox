import { init2PlayerGame } from "./chessScript.js";
import { backBtn } from "./styleScript.js";

export const onlineMode = document.querySelector("#online");
export const twoPlayersMode = document.querySelector("#twoPlayers");

const modeSelector = document.querySelector("#modeSelector");
const nameTag = document.querySelector("#name");

onlineMode.addEventListener("click", () =>{
    onlineMode.classList.toggle("active");
    twoPlayersMode.classList.toggle("hidden");
});

twoPlayersMode.addEventListener("click", () =>{
    modeSelector.classList.add("hidden");
    nameTag.classList.add("hidden");
    backBtn.classList.remove("blocked");
    init2PlayerGame();
});