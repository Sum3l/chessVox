import { defineCustomElements } from "/@bitjson/qr-code/dist/esm/index.js";
import { hue, saturation, lightness } from "./styleScript.js";

export const waitingRoom = document.querySelector("#waitingRoom");
export const waitConnection = document.querySelector("#waitConnection");
export const waitFriend = document.querySelector("#waitFriend");
export const qrCode = document.querySelector("#qrCode");
export const link = document.querySelector("#link");
export const cancel = document.querySelector("#cancel");

defineCustomElements(window);
export const createQRCode = (link) => {
    if (qrCode.childElementCount)
        qrCode.removeChild(qrCode.firstChild);
    const qrElement = document.createElement("qr-code");

    qrElement.setAttribute("class", "qrClass");
    qrElement.setAttribute("contents", link);
    qrElement.setAttribute("module-color", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    qrElement.setAttribute("position-ring-color", `hsl(${hue}, ${saturation}%, 100%)`);
    qrElement.setAttribute("position-center-color", `hsl(${hue}, ${saturation - 20}%, ${lightness - 40}%)`);
    qrElement.setAttribute("mask-x-to-y-ratio", "1.2");

    qrElement.addEventListener("codeRendered", () => {
        // fade in 
        qrElement.animateQRCode((targets, _x, _y, _count, entity) => ({
            targets,
            from: entity === 'module' ? Math.random() * 200 : 200,
            duration: 500,
            easing: 'cubic-bezier(1,1,0,.5)',
            web: {
                opacity: [0, 1],
                scale: [0.3, 1.13, 0.93, 1],
            },
        }));
    });
    return qrElement;
};

export const waiting = (element) => {
    waitingRoom.classList.remove("hidden");
    if (element === "friend")
        waitFriend.classList.remove("hidden");
    if (element === "connection")
        waitConnection.classList.remove("hidden");
};

export const endWaiting = (element = null, complete = true) => {
    console.log(element, complete);
    if (complete === true) {
        if (waitingRoom.classList.contains("inactive")) {
            waitingRoom.classList.remove("inactive");
            return;
        } else {
            waitingRoom.classList.add("hidden");
        }
    }
    if (complete === false) {
        waitingRoom.classList.add("hidden");
        waitingRoom.classList.add("inactive");
    }
    if (element === "friend")
        waitFriend.classList.add("hidden");
    if (element === "connection")
        waitConnection.classList.add("hidden");
};

// createQRCode("https://example.com");