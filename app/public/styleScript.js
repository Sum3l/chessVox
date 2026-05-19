import { resetBoard, destroyBoard } from "./chessScript.js";

const canvas = document.querySelector("#wave");
const ctx = canvas.getContext("2d");
const micBtn = document.querySelector("#micBtn");
const shockwave = document.querySelector("#shockwave");
const backBtn = document.querySelector("#back");
const settingsBtn = document.querySelector("#settings");

let hue = 208;
let saturation = 31;
let lightness = 81;
const changeShade = () => {
    document.documentElement.style.setProperty("--shade", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
};
changeShade();

for (let e of document.querySelectorAll('input[type="range"].styled-slider')) {
    if (e.id === "sfx") {
        // for .slider-progress
        e.style.setProperty('--value', e.value);
        e.style.setProperty('--min', e.min == '' ? '0' : e.min);
        e.style.setProperty('--max', e.max == '' ? '100' : e.max);
        e.addEventListener('input', () => { e.style.setProperty('--value', e.value) });
    }
    if (e.id === "hue")
        e.addEventListener('input', (event) => {
            hue = e.value;
            changeShade();
        });
    if (e.id === "saturation")
        e.addEventListener('input', () => {
            saturation = e.value;
            changeShade();
        });
    if (e.id === "lightness")
        e.addEventListener('input', () => {
            lightness = e.value;
            changeShade();
        });
}

const width = window.innerWidth;
const height = window.innerHeight;
document.body.style.width = width + "px";
document.body.style.height = height + "px";

const rect = canvas.getBoundingClientRect();
const CANVAS_WIDTH = canvas.width = rect.width;
const CANVAS_HEIGHT = canvas.height = rect.height;

const CANVAS_CENTER_X = canvas.width / 2;
const CANVAS_CENTER_Y = canvas.height / 2;

let isListening = false;
let timeOffset = 0; // controls speed

const BASE_RADIUS = micBtn.getBoundingClientRect().width / 2 - 40; // comparison to button 
let AMPLITUDE = 1; // The height of the "voice" spikes
const SMOOTHNESS = 120; // Number of distinct points that make up the circle

const drawVisualizer = () => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.lineWidth = 4;
    // ctx.strokeStyle = '#00d2ff';
    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    ctx.shadowBlur = 15;
    // ctx.shadowColor = '#00d2ff';
    ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

    if (isListening) if (AMPLITUDE < 25) AMPLITUDE += 1;
    if ((!isListening) && (AMPLITUDE > 5)) AMPLITUDE -= 1;

    ctx.beginPath();

    for (let i = 0; i < SMOOTHNESS; i++) {
        const angle = (i / SMOOTHNESS) * Math.PI * 2;

        // CALCULATE VARIANCE (This is the voice reaction math!)

        // Currently using Math.sin simulation (organic undulation):
        // Combine multiple frequencies to look irregular
        const simVolume = (Math.sin(angle * 7 + timeOffset * 2) * 0.7) +
            (Math.sin(angle * 13 + timeOffset) * 0.3);

        // ** FUTURE HOOK FOR REAL AUDIO **
        // Replace simVolume with normalized live microphone data:
        // const liveVolume = analyserNode.getNormalizedValueAtIndex(i);

        // Final Dynamic Radius
        const radius = BASE_RADIUS + (simVolume * AMPLITUDE);

        // iii. POLAR TO CARTESIAN CONVERSION
        // (Calculate precise x, y pixel position on the grid)
        const x = CANVAS_CENTER_X + radius * Math.cos(angle);
        const y = CANVAS_CENTER_Y + radius * Math.sin(angle);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Advance time 
    timeOffset += 0.05;

    // infinite animation loop at ~60fps
    requestAnimationFrame(drawVisualizer);
}

micBtn.addEventListener("click", () => {
    isListening = !isListening;
    micBtn.classList.toggle("listening");
});

micBtn.addEventListener("mouseenter", () => {
    let voiceResponse1 = setInterval(() => {
        AMPLITUDE += 1;
        console.log("mouse enter");
        if (AMPLITUDE >= 5)
            clearInterval(voiceResponse1);
    }, 100);
});

micBtn.addEventListener("mouseleave", () => {
    if (!isListening) {
        let voiceResponse2 = setInterval(() => {
            AMPLITUDE -= 1;
            console.log("mouse leave");
            if (AMPLITUDE <= 1)
                clearInterval(voiceResponse2);
        }, 100);
    }
});

const triggerCommandShockwave = () => {
    shockwave.classList.remove("fire");

    // Force the browser to recalculate the layout (Reflow)
    // This is a JavaScript trick required to restart a CSS animation instantly!
    void shockwave.offsetWidth;

    shockwave.classList.add("fire");
}

// 3. Right Click: Simulate a Pico Voice Command
micBtn.addEventListener("contextmenu", e => {
    e.preventDefault();

    if (isListening) {
        triggerCommandShockwave();
    } else {
        alert("Turn the mic on first!");
    }
});

backBtn.addEventListener("click", e => {
    if (!backBtn.classList.contains("blocked"))
        if (backBtn.classList.contains("active")) {
            backBtn.querySelector(".box").classList.remove("show");
            backBtn.classList.remove("active");
            void backBtn.offsetWidth;
            backBtn.classList.add("inactive");
            setTimeout(() => {
                backBtn.classList.remove("pauseHover");
            }, 1000);
        } else {
            if (backBtn.classList.contains("inactive"))
                backBtn.classList.remove("inactive");
            void backBtn.offsetWidth;
            backBtn.classList.add("active");
            backBtn.classList.add("pauseHover");
            setTimeout(() => {
                if (backBtn.classList.contains("active"))
                    backBtn.querySelector(".box").classList.add("show");
            }, 1900);
        }
});

settingsBtn.addEventListener("click", e => {
    if (!e.target.classList.contains("settingsBoxChild"))
        if (settingsBtn.classList.contains("active")) {
            settingsBtn.querySelector(".box").classList.remove("show");
            settingsBtn.classList.remove("active");
            void settingsBtn.offsetWidth;
            settingsBtn.classList.add("inactive");
            setTimeout(() => {
                settingsBtn.classList.remove("pauseHover");
            }, 1000);
        } else {
            if (settingsBtn.classList.contains("inactive"))
                settingsBtn.classList.remove("inactive");
            void settingsBtn.offsetWidth;
            settingsBtn.classList.add("active");
            settingsBtn.classList.add("pauseHover");
            setTimeout(() => {
                if (settingsBtn.classList.contains("active"))
                    settingsBtn.querySelector(".box").classList.add("show");
            }, 1900);
        }
});

document.querySelector("#themes").addEventListener("click", e => {
    document.querySelector("#colorPicker").classList.toggle("show");
});


// only for 2 players
document.querySelector("#restart").addEventListener("click", () => {
    resetBoard();
});

document.querySelector("#mainMenu").addEventListener("click", () => {
    destroyBoard();
    document.querySelector("#modeSelector").classList.remove("hidden");
    document.querySelector("#name").classList.remove("hidden");
    setTimeout(() => backBtn.classList.add("blocked"), 1000);
});

drawVisualizer();