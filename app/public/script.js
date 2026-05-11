const canvas = document.querySelector("#wave");
const ctx = canvas.getContext("2d");
const micBtn = document.querySelector("#micBtn");

document.documentElement.style.setProperty("--shade", "hsl(208, 31%, 81%)");

const rect = canvas.getBoundingClientRect();
const CANVAS_WIDTH = canvas.width = rect.width;
const CANVAS_HEIGHT = canvas.height = rect.height;

const CANVAS_CENTER_X = canvas.width / 2;
const CANVAS_CENTER_Y = canvas.height / 2;

let isListening = true;
let timeOffset = 0; // controls speed

const BASE_RADIUS = micBtn.getBoundingClientRect().width / 2 - 40; // comparison to button 
const MAX_AMPLITUDE = 5; // The max height of the "voice" spikes
const SMOOTHNESS = 120; // Number of distinct points that make up the circle

function drawVisualizer() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.lineWidth = 4;
    // ctx.strokeStyle = '#00d2ff';
    ctx.strokeStyle = " hsl(208, 31%, 81%)";

    ctx.shadowBlur = 15;
    // ctx.shadowColor = '#00d2ff';
    ctx.shadowColor = "hsl(208, 31%, 81%)";


    if (isListening) {

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
            const radius = BASE_RADIUS + (simVolume * MAX_AMPLITUDE);

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
    }

    // infinite animation loop at ~60fps
    requestAnimationFrame(drawVisualizer);
}

micBtn.addEventListener('click', () => {
    isListening = !isListening;
    micBtn.classList.toggle('listening');
});

drawVisualizer();