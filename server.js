import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(import.meta.dirname, "app/public")));

app.use("/chessground", express.static(path.join(import.meta.dirname, "node_modules/@lichess-org/chessground")));
app.use("/chess.js", express.static(path.join(import.meta.dirname, "node_modules/chess.js/dist")));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log("Ready to process voice commands!");
});