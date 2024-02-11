"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}));
const port = 3000;
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const userToken = (0, database_1.makeUser)(username, password);
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
app.post("/similarUsernames", (req, res) => {
    const { username } = req.body;
    res.status(200).json({
        "usernames": (0, database_1.similarUsernames)(username)
    });
});
app.post('/contacts', (req, res) => {
    const { token } = req.body;
    const username = (0, database_1.getUsernameFromToken)(token);
    res.status(200).json((0, database_1.getContacts)(username));
});
app.post("/pixel", (req, res) => {
    const { pixelX, pixelY, token, contact, color } = req.body;
    // Color is in format #FFFFFF or #FE0B52 or etc.
    const username = (0, database_1.getUsernameFromToken)(token);
    if ((0, database_1.writePixel)(username, contact, pixelX, pixelY, color)) {
        res.status(200).json({ "message": "Success" });
    }
    else {
        res.status(500).json({ "message": "Failure" });
    }
});
app.post("/getCanvas", (req, res) => {
    const { token, contact } = req.body;
    const username = (0, database_1.getUsernameFromToken)(token);
    const canvas = (0, database_1.getCanvas)(username, contact);
    if (canvas) {
        res.status(200).json({
            image: canvas,
            turn: (0, database_1.getTurn)(username, contact)
        });
    }
    else { // TODO: 
        res.status(404).json({ "message": "Not found" });
    }
});
app.listen(port);
