"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const cors_1 = __importDefault(require("cors"));
const node_process_1 = __importDefault(require("node:process"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}));
const port = 3000;
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const userToken = await (0, database_1.signInOrSignUp)(username, password);
    if (userToken == "") {
        res.status(403).json({
            "error": "Password incorrect"
        });
        return;
    }
    res.status(200).json({
        "token": userToken
    });
});
app.post("/similarUsernames", async (req, res) => {
    const { username } = req.body;
    res.status(200).json({
        "usernames": await (0, database_1.similarUsernames)(username)
    });
});
app.post('/contacts', async (req, res) => {
    const { token } = req.body;
    const username = await (0, database_1.getUsernameFromToken)(token);
    res.status(200).json(await (0, database_1.getContacts)(username));
});
app.post("/pixel", async (req, res) => {
    const { pixelX, pixelY, token, contact, color } = req.body;
    // Color is in format #FFFFFF or #FE0B52 or etc.
    const username = await (0, database_1.getUsernameFromToken)(token);
    if (await (0, database_1.writePixel)(username, contact, pixelX, pixelY, color)) {
        res.status(200).json({ "message": "Success" });
    }
    else {
        res.status(500).json({ "message": "Failure" });
    }
});
app.post("/getCanvas", async (req, res) => {
    const { token, contact } = req.body;
    const username = await (0, database_1.getUsernameFromToken)(token);
    const canvas = await (0, database_1.getCanvas)(username, contact);
    if (canvas) {
        res.status(200).json({
            image: canvas,
            turn: await (0, database_1.getTurn)(username, contact)
        });
    }
    else {
        res.status(404).json({ "message": "Not found" });
    }
});
const server = app.listen(port);
node_process_1.default.stdin.resume(); // so the program will not close instantly
node_process_1.default.on('beforeExit', async (code) => {
    await (0, database_1.closeDatabase)();
    server.close();
});
