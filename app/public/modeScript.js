import { init2PlayerGame } from "./chessScript.js";

const onlineMode = document.querySelector("#online");
const twoPlayersMode = document.querySelector("#twoPlayers");

const modeSelector = document.querySelector("#modeSelector");
const nameTag = document.querySelector("#name");
const backBtn = document.querySelector("#back");

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