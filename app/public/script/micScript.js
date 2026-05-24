import { chess, updateBoard } from "./chessScript.js";
import { backBtn, settingsBtn, themes , restart, quit, moveCallout, tempo, micBtn, startVisualTimer, stopVisualTimer } from "./styleScript.js";
import { twoPlayersMode, onlineMode } from "./modeScript.js";

const yourMove = document.querySelector("#yourMove");
let pendingAction = null;
let isSpeaking = false;
let actionTimer = null;

const phoneticMap = {
    'alpha': 'a',   'apple': 'a',       'a': 'a',
    'bravo': 'b',   'boy': 'b',         'b': 'b',       'be': 'b',
    'charlie': 'c', 'cat': 'c',         'c':'c',        'see': 'c',
    'delta': 'd',   'dog': 'd',         'd': 'd',
    'echo': 'e',    'elephant': 'e',    'e': 'e', 
    'foxtrot': 'f', 'frank': 'f',       'f': 'f',       'fox': 'f',     'forks': 'f',       'folks': 'f',       'ef': 'f',
    'golf': 'g',    'girl': 'g',        'g': 'g',
    'hotel': 'h',   'harry': 'h',       'h': 'h',
};

const numMap = {
    'one': 1,     'two': 2,
    'three': 3,   'four': 4,    'for': 4,
    'five': 5,    'six': 6,
    'seven': 7,   'eight': 8,   'ate': 8,
};

const pieceMap = {
    'king': 'K',    'k': 'K',
    'queen': 'Q',   'q': 'Q',   'queue': 'Q',
    'rook': 'R',    'r': 'R',   'are': 'R',
    'knight': 'N',  'n': 'N',   'night': 'N',
    'bishop': 'B',  'b': 'B',   'be': 'B',
};

const pieceNames = {
        'p': 'Pawn', 'n': 'Knight', 'b': 'Bishop', 
        'r': 'Rook', 'q': 'Queen', 'k': 'King'
    };

const hotWordsMap = {
    'back': backBtn,
    'restart': restart,
    'reset': restart,
    'quit': quit,
    'exit': quit,
    'settings': settingsBtn,
    'options': settingsBtn,
    'voice toggle': moveCallout, 
    'call out': moveCallout,
    'themes': themes,
    'two player': twoPlayersMode,
    'one player': onlineMode,
    'friend': null,
    'find': null,
    'blind': null,

    // no added right now 
    'takeback': null,
    'undo': null,
    'resign': null,
    'draw': null,
};

// Chrome's duplicate event bug,
//  Chrome's audio garbage collection bug, 
//  the hardware echo-loop, 
//  and the auto-disconnect server timeout.

const announceMove = (text, onFinished = null) => {
    if (!window.speechSynthesis) return;

    // speech disabled 
    if (!moveCallout.classList.contains("on")) {
        onFinished();
        return;
    }

    // Cancels currently playing audio so it doesn't overlap
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Attach to window so Chrome's garbage collector doesn't delete it mid-sentence
    window.currentUtterance = utterance;

    // utterance.onstart = () => { 
    //     isSpeaking = true; 
    //     console.log("Computer speaking (Mic muted)");
    // };
    isSpeaking = true; 
    console.log("Computer speaking (Mic muted)");

    utterance.onend = () => { 
        // delay before umMuting to gives the speech engine time to clear the echo transcript
        setTimeout(() => {
            isSpeaking = false; 
            console.log("Computer finished (Mic listening)");
            
            if (onFinished) onFinished();
        }, 1500);
    };

    utterance.onerror = (e) => {
        console.error("Audio playback error:", e);
        isSpeaking = false; 

        if (onFinished) onFinished();
    };

    utterance.rate = 1.0; // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)

    window.speechSynthesis.speak(utterance);
};

const parseNextWordToSAN = (word1, word2) => {
    let san = '';
    if (word2 && phoneticMap[word2[0]]) {
        let num = parseInt(word2[1]);
        if (!isNaN(num) && num >= 1 && num <= 8)
            san = phoneticMap[word2[0]] + num;
    }
    if (word1 == san)
        return '';
    return san;
};

const parseWordToSAN = wordParm => {
    let word = wordParm.replace(/(\+|x)/g, '');
    let san = '';
    if (pieceMap[word[0]] !== undefined) {
        if (phoneticMap[word[1]])
            if (!isNaN(word[2]) && word[2] >= 1 && word[2] <= 8)
                san = pieceMap[word[0]] + phoneticMap[word[1]] + word[2];
        // else if (!isNaN(numMap[word.slice(2)]))
        //     san += numMap[word.slice(2)];
    } else if (phoneticMap[word[0]]) {
        let num = parseInt(word[1]);
        if (!isNaN(num) && num >= 1 && num <= 8)
            san = phoneticMap[word[0]] + num;
        if (phoneticMap[word[1]]) {
            let num = parseInt(word[2]);
            if (!isNaN(num) && num >= 1 && num <= 8)
                san += phoneticMap[word[0]] + phoneticMap[word[1]] + num;
        }
    }
    return san;
};

const parseTranscriptToSAN = transcript => {
    const lowerTranscript = transcript.toLowerCase();
    const longCastlePhrases = [
        "long castle", "castle long",
        "queenside", "queen side"
    ];
    const shortCastlePhrases = [
        "short castle", "castle short",
        "kingside", "king side",
        "castle" // absolute fallback
    ];

    if (longCastlePhrases.some(phrase => lowerTranscript.includes(phrase))) 
        return "O-O-O";

    if (shortCastlePhrases.some(phrase => lowerTranscript.includes(phrase))) 
        return "O-O";

    const words = lowerTranscript.replace(/(to|move|takes|capture)/g, '').split(/\s+/);
    let san = '';

    // Standard dictionary match
    for (let word of words) {
        if (pieceMap[word]) san += pieceMap[word];
        else if (phoneticMap[word]) san += phoneticMap[word];
        else if (!isNaN(word) && word >= 1 && word <= 8) san += word;
        else if (!isNaN(numMap[word])) san += numMap[word];
    }

    // Complex look-ahead for orphaned pieces
    if (san === 'Q' || san === 'R' || san === 'B' || san === 'N')
        for (let i = 0; i < words.length; i++) {
            san = parseWordToSAN(words[i]);
            
            if (words[i + 1] && pieceMap[words[i + 1]] && pieceMap[words[i + 1]] !== 'K') 
                san += pieceMap[words[i + 1]];

            if (san.length == 2) {
                if (words[i - 1] && pieceMap[words[i - 1]]) {
                    san = pieceMap[words[i - 1]] + san;
                    return san;
                }
                if (words[i + 1] && pieceMap[words[i + 1]] && pieceMap[words[i + 1]] !== 'K') {
                    san += pieceMap[words[i + 1]];
                    return san;
                }
                san += parseNextWordToSAN(words[i], words[i + 1]);
                if (words[i + 2] && pieceMap[words[i + 2]] && pieceMap[words[i + 2]] !== 'K') {
                    san += pieceMap[words[i + 2]];
                }
            }
        }

    if (san === '')
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            san = parseWordToSAN(word);
            if (pieceMap[word[word.length - 1]] && pieceMap[word[word.length - 1]] !== 'K') 
                san += pieceMap[word[word.length - 1]];
            if (san.length == 2) {
                san += parseNextWordToSAN(word, words[i + 1]);
                let word2 = words[i + 1];
                if (word2 && pieceMap[word2[word2.length - 1]] && pieceMap[word2[word2.length - 1]] !== 'K') 
                    san += pieceMap[word2[word2.length - 1]];
            }
        }
    // for bishop and b
    // can't check for b row pawns attack
    let sanArray = san.split('');
    
    if (sanArray[0] === 'B') {
        for (let i = 0; i < sanArray.length; i++) {
            // Check for Bb pattern (e.g., BB4 -> Bb4)
            if (sanArray[i] === 'B' && sanArray[i + 1] && !isNaN(sanArray[i + 1])) sanArray[i] = 'b';
            // Check for double B (e.g., BB -> Bb)
            if (sanArray[i] === 'B' && sanArray[i - 1] && sanArray[i - 1] === 'B') sanArray[i] = 'b';
        }
    }

    san = sanArray.join('');
    return san.length >= 2 ? san : null;
}

class MicController {
    constructor(onTextRecognized, onError) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) throw new Error("Browser not supported");

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.shouldBeListening = false;

        // Wrap callback ideBouncer 
        this.debouncedProcess = this.debounce((transcript) => {
            onTextRecognized(transcript);
        }, 300);

        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript.trim().toLowerCase();

            // if (!result.isFinal) return; // Ignore partial guesses
            const isFinal = result.isFinal;
            if (!isFinal) {
                onTextRecognized(transcript, isFinal);
                return;
            }

            this.debouncedProcess(transcript);
        };
        this.recognition.onerror = (event) => {
            if (event.error !== 'no-speech') onError(event.error);
        };
        this.recognition.onend = () => {
            if (this.shouldBeListening) {
                console.log("Chrome auto-disconnected. Restarting mic...");
                try { this.recognition.start(); } catch (e) {}
            }
        };
    }

    // Debounce Logic
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    start() { 
        this.shouldBeListening = true;
        try { this.recognition.start(); } catch(e) {} 
    }
    stop() { 
        this.shouldBeListening = false;
        this.recognition.stop(); 
    }
}

const executePendingAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'move') {
        chess.move(pendingAction.data);
        updateBoard();
        console.log("Move played!", pendingAction.data);

    } else if (pendingAction.type === 'hotword') {
        if (typeof pendingAction.data === 'function') {
            pendingAction.data();
        } else if (pendingAction.data && typeof pendingAction.data.click === 'function') {
            pendingAction.data.click();
        }
    }
    micBtn.dispatchEvent(new MouseEvent('contextmenu'));
    yourMove.textContent = "";
    pendingAction = null; 
};

const initializeVoiceControl = () => {
    const handleTranscript = (transcript, isFinal = true) => {
        const lowerTranscript = transcript.toLowerCase();
        // console.log("User said:", lowerTranscript);
        if (isFinal) 
            console.log("(Final):", lowerTranscript);

        // confirmation response 
        if (pendingAction !== null) {
            // \b ensures we match exact words "not" doesn't trigger "no"
            const isYes = /\b(yes|go|confirm|move|do it|yep|correct)\b/.test(lowerTranscript);
            const isNo = /\b(no|reject|cancel|delete|stop|nope|wrong)\b/.test(lowerTranscript);
            
            if (isNo) {
                window.speechSynthesis.cancel();
                clearTimeout(actionTimer);
                stopVisualTimer();

                console.log("Action rejected");
                yourMove.textContent = "Cancelled.";
                setTimeout(() => yourMove.textContent = "", 1500);
                
                pendingAction = null; 
                isSpeaking = false;
                return;
            }

            if (isYes) {
                window.speechSynthesis.cancel();
                clearTimeout(actionTimer);
                stopVisualTimer();

                isSpeaking = false;
                executePendingAction();
                return;
            }
            return; 
        }
        if (isSpeaking) return;
        if (!isFinal) return;

        // Intercept HotWords 
        for (const [word, action] of Object.entries(hotWordsMap)) 
            if (lowerTranscript.includes(word)) {
                console.log(`HotWord triggered: ${word}`);
                const isFunction = typeof action === 'function';
                const isDomElement = action && typeof action.click === 'function';

                if (isFunction || isDomElement) {
                    let prompt = "";
                    if (word.includes("call out")) prompt = "move callout?";
                    else prompt = word.includes("player") ? `Start ${word} game?` : `Execute ${word}?`;
                    yourMove.textContent = prompt;
                    pendingAction = { type: 'hotword', data: action };

                    announceMove(prompt, () => {
                        if (pendingAction !== null) {
                            clearTimeout(actionTimer);

                            startVisualTimer(tempo);
                            actionTimer = setTimeout(executePendingAction, tempo);     
                        } 
                    });
                }
                return; 
            }
        const sanMove = parseTranscriptToSAN(lowerTranscript);

        if (!sanMove) {
            const strippedForGhost = lowerTranscript.replace(/[.,!?]/g, '').trim();
            if (/^(yes|go|confirm|move|do it|yep|correct|no|reject|cancel|delete|stop|nope|wrong)$/.test(strippedForGhost)) 
                return; // Silently ignore the ghost input
            
            yourMove.textContent = "Didn't catch that.";
            setTimeout(() => yourMove.textContent = "", 1500);
            return;
        }

        console.log("Attempting move:", sanMove);
        try {
            const moveResult = chess.move(sanMove);
            
            if (moveResult) {
                chess.undo(); 
                
                const piece = pieceNames[moveResult.piece];
                const destination = moveResult.to;
                let spokenText = `${piece} to ${destination}?`;

                if (moveResult.san === 'O-O') spokenText = "Castle kingside?";
                if (moveResult.san === 'O-O-O') spokenText = "Castle queenside?";
                if (moveResult.flags.includes('c')) spokenText = `${piece} captures on ${destination}?`;
                if (moveResult.flags.includes('p')) spokenText = `Pawn promotes to ${pieceNames[moveResult.promotion]}?`;

                yourMove.textContent = spokenText;
                pendingAction = { type: 'move', data: sanMove };

                announceMove(spokenText, () => {
                    if (pendingAction !== null) {
                        clearTimeout(actionTimer);

                        startVisualTimer(tempo);
                        actionTimer = setTimeout(() => {
                            console.log("move autoplay");
                            executePendingAction();
                        }, tempo);
                    }
                });
            }
        } catch (error) {
            console.log("Illegal move format ignored.");
        }
    };

    const mic = new MicController(handleTranscript, console.error);

    // Attach to a UI button
    micBtn.addEventListener('click', () => {
        if (micBtn.classList.contains('listening')) {
            mic.start();
            console.log("Listening...");
        } else {
            mic.stop();
            console.log("Mic stopped");
        }
    });
}

initializeVoiceControl();
