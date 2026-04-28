const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'app/public')));

app.use('/cm-chessboard', express.static(path.join(__dirname, 'node_modules/cm-chessboard')));

app.use('/chess.js', express.static(path.join(__dirname, 'node_modules/chess.js/dist')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log('Ready to process voice commands!');
});