"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getUsernameFromToken = exports.similarUsernames = exports.makeUser = exports.writePixel = exports.getCanvas = exports.getTurn = exports.getContacts = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const crypto_1 = require("crypto");
const db = new better_sqlite3_1.default('fubar.db');
const canvasSize = 10;
const colorSubstringSize = 7;
const defaultCanvasColor = "#FFFFFF";
db.exec(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT
);`);
db.exec(`CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    username TEXT,
    FOREIGN KEY (username) REFERENCES users(username)
);`);
db.exec(`CREATE TABLE IF NOT EXISTS canvases (
    id TEXT PRIMARY KEY,
    username_one TEXT,
    username_two TEXT,
    canvas TEXT,
    waiting_on TEXT,
    FOREIGN KEY (username_one) REFERENCES users(username),
    FOREIGN KEY (username_two) REFERENCES users(username)
);`);
function getContacts(username) {
    const stmt = db.prepare('SELECT * FROM canvases WHERE username_one = ? OR username_two = ?;');
    const result = stmt.all(username, username);
    const contacts = [];
    result.map((res) => res).forEach(canvas => {
        if (canvas.username_one != username) {
            contacts.push({
                username: canvas.username_one,
                status: canvas.waiting_on == username ? "WAITING_SELF" : "WAITING_CONTACT"
            });
        }
        else {
            contacts.push({
                username: canvas.username_two,
                status: (canvas.waiting_on == username ? "WAITING_SELF" : "WAITING_CONTACT")
            });
        }
    });
    return contacts;
}
exports.getContacts = getContacts;
function getTurn(username, contact) {
    const stmt = db.prepare('SELECT waiting_on FROM canvases WHERE username_one = ? AND username_two = ?;');
    const result = stmt.get(username, contact);
    const resultFromContact = stmt.get(contact, username);
    const localWaitingOn = result?.waiting_on;
    const contactWaitingOn = resultFromContact?.waiting_on;
    if (result) {
        return localWaitingOn == username ? "WAITING_SELF" : "WAITING_CONTACT";
    }
    else if (resultFromContact) {
        return contactWaitingOn == username ? "WAITING_SELF" : "WAITING_CONTACT";
    }
    else {
        return null;
    }
}
exports.getTurn = getTurn;
function userExists(username) {
    const existsResult = db.prepare("SELECT EXISTS(SELECT 1 FROM users WHERE username = ?);")
        .get(username);
    const exists = Object.values(existsResult)[0] == 1;
    return exists;
}
function canvasExists(usernameOne, usernameTwo, pure = false) {
    const existsResult = db.prepare("SELECT * FROM canvases WHERE username_one = ? AND username_two = ?;")
        .get(usernameOne, usernameTwo);
    if (existsResult) {
        return true;
    }
    if (pure) {
        return false;
    }
    const existsResultTwo = db.prepare("SELECT * FROM canvases WHERE username_one = ? AND username_two = ?;")
        .get(usernameTwo, usernameOne);
    if (existsResultTwo) {
        return true;
    }
    return false;
}
function canvasToDatabaseRepresentation(canvas) {
    let final = "";
    for (const row of canvas) {
        for (const cell of row) {
            final += cell;
        }
    }
    return final;
}
function getCanvas(usernameOne, usernameTwo) {
    if (!canvasExists(usernameOne, usernameTwo)) {
        return null;
    }
    let canvasResult = db.prepare("SELECT canvas FROM canvases WHERE username_one = ? AND username_two = ?;")
        .get(usernameOne, usernameTwo);
    if (!canvasResult) {
        canvasResult = db.prepare("SELECT canvas FROM canvases WHERE username_one = ? AND username_two = ?;")
            .get(usernameTwo, usernameOne);
    }
    const canvas = new Array(canvasSize);
    for (let i = 0; i < canvasSize; i++) {
        canvas[i] = new Array(canvasSize);
        for (let k = 0; k < canvasSize; k++) {
            canvas[i][k] = "";
        }
    }
    const image = canvasResult.canvas.replaceAll('#', '');
    for (let i = 0; i < canvasSize * canvasSize; i++) {
        const color = image.substring(i * 6, (i + 1) * 6);
        const x = i % canvasSize;
        const y = Math.floor(i / canvasSize);
        canvas[y][x] = '#' + color;
    }
    // let index = 0;
    // for (let pixel of image) {
    //     canvas[Math.floor(index / canvasSize)][index % canvasSize] = pixel;
    //     index++;
    // }
    return canvas;
}
exports.getCanvas = getCanvas;
function writePixel(usernameOne, usernameTwo, pixelX, pixelY, color, usernameOneIsFinishedUsername = true) {
    const newUserWaitingOn = usernameOneIsFinishedUsername ? usernameTwo : usernameOne;
    if (!canvasExists(usernameOne, usernameTwo)) {
        const canvas = new Array(canvasSize);
        for (let i = 0; i < canvasSize; i++) {
            canvas[i] = new Array(canvasSize);
            for (let k = 0; k < canvasSize; k++) {
                canvas[i][k] = defaultCanvasColor;
            }
        }
        canvas[pixelX][pixelY] = color;
        console.log(usernameOne, " and ", usernameTwo, " made a canvas with waiting for ", newUserWaitingOn);
        const createCanvasStmt = db.prepare("INSERT INTO canvases (id, username_one, username_two, canvas, waiting_on) VALUES (?, ?, ?, ?, ?);");
        createCanvasStmt.run((0, crypto_1.randomUUID)().toString(), usernameOne, usernameTwo, canvasToDatabaseRepresentation(canvas), newUserWaitingOn);
        return true;
    }
    else if (canvasExists(usernameTwo, usernameOne, true)) {
        const temp = usernameOne;
        usernameOne = usernameTwo;
        usernameTwo = temp;
    }
    const canvas = getCanvas(usernameOne, usernameTwo);
    if (canvas == null) {
        return false;
    }
    canvas[pixelX][pixelY] = color;
    const stmt = db.prepare("UPDATE canvases SET canvas = ?, waiting_on = ? WHERE username_one = ? AND username_two = ?;");
    stmt.run(canvasToDatabaseRepresentation(canvas), newUserWaitingOn, usernameOne, usernameTwo);
    return true;
}
exports.writePixel = writePixel;
function makeUser(username, password) {
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?);");
    if (userExists(username)) {
        // We have the user, check their password
        const checkUserPasswordStmt = db.prepare(`SELECT password FROM users WHERE username=(?);`);
        const savedPassword = checkUserPasswordStmt.get(username)?.password;
        if (password == savedPassword) {
            return createUserToken(username);
        }
        return "";
    }
    stmt.run(username, password);
    return createUserToken(username);
}
exports.makeUser = makeUser;
function similarUsernames(username) {
    const stmt = db.prepare(`SELECT username FROM users WHERE username LIKE ?;`);
    const usernames = stmt.all(`%${username}%`).map(row => row.username);
    return usernames;
}
exports.similarUsernames = similarUsernames;
function createUserToken(username) {
    const stmt = db.prepare("INSERT INTO tokens (token, username) VALUES (?, ?);");
    const token = (0, crypto_1.randomUUID)();
    stmt.run(token, username);
    return token;
}
function getUsernameFromToken(token) {
    const stmt = db.prepare(`SELECT username FROM tokens WHERE token = ?;`);
    return stmt.get(token)?.username;
}
exports.getUsernameFromToken = getUsernameFromToken;
function closeDatabase() {
    db.close();
}
exports.closeDatabase = closeDatabase;
