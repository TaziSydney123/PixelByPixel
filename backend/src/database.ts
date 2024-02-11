import DatabaseConstructor, { Database } from "better-sqlite3";
import { randomUUID } from 'crypto';
const db = new DatabaseConstructor('fubar.db', /*{ verbose: console.log }*/);

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

export function getContacts(username: string) {
    const stmt = db.prepare('SELECT * FROM canvases WHERE username_one = ? OR username_two = ?;');
    const result = stmt.all(username, username);

    const contacts: {
        username: string,
        status: string
    }[] = [];
    
    result.map((res) => (res as unknown as { username_one: string, username_two: string , waiting_on: string})).forEach(canvas => {
        if (canvas.username_one != username) {
            contacts.push({
                username: canvas.username_one,
                status: canvas.waiting_on == username ? "WAITING_SELF" : "WAITING_CONTACT"
            });
        } else {
            contacts.push({
                username: canvas.username_two,
                status: (canvas.waiting_on == username ? "WAITING_SELF" : "WAITING_CONTACT")
            });   
        }
    });

    return contacts;
}

export function getTurn(username: string, contact: string) {
    const stmt = db.prepare('SELECT waiting_on FROM canvases WHERE username_one = ? AND username_two = ?;');
    const result = stmt.get(username, contact);
    const resultFromContact = stmt.get(contact, username);
    
    const localWaitingOn = (result as unknown as { waiting_on: string})?.waiting_on;
    const contactWaitingOn = (resultFromContact as unknown as { waiting_on: string})?.waiting_on;

    if (result) {
        return localWaitingOn == username ? "WAITING_SELF" : "WAITING_CONTACT";
    } else if (resultFromContact) {
        return contactWaitingOn == username ? "WAITING_SELF" : "WAITING_CONTACT";
    } else {
        return null;
    }
}

function userExists(username: string): boolean {
    const existsResult = db.prepare("SELECT EXISTS(SELECT 1 FROM users WHERE username = ?);")
        .get(username) as unknown as { [key: string]: number };
    const exists = Object.values(existsResult)[0] == 1;
    return exists;
}

function canvasExists(usernameOne: string, usernameTwo: string, pure: boolean = false): boolean {
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

function canvasToDatabaseRepresentation(canvas: string[][]): string {
    let final = "";
    for (const row of canvas) {
        for (const cell of row) {
            final += cell;
        }
    }
    return final;
}

export function getCanvas(usernameOne: string, usernameTwo: string): string[][] | null {
    if (!canvasExists(usernameOne, usernameTwo)) {
        return null;
    }
    
    let canvasResult = db.prepare("SELECT canvas FROM canvases WHERE username_one = ? AND username_two = ?;")
        .get(usernameOne, usernameTwo) as unknown as { canvas: string };
    
    if (!canvasResult) {
        canvasResult = db.prepare("SELECT canvas FROM canvases WHERE username_one = ? AND username_two = ?;")
        .get(usernameTwo, usernameOne) as unknown as { canvas: string };
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

export function writePixel(usernameOne: string, usernameTwo: string, pixelX: number, pixelY: number, color: string, usernameOneIsFinishedUsername: boolean = true): boolean {
    const newUserWaitingOn = usernameOneIsFinishedUsername ? usernameTwo : usernameOne;

    if (!canvasExists(usernameOne, usernameTwo)) {
        const canvas: string[][] = new Array(canvasSize);
        for (let i = 0; i < canvasSize; i++) {
            canvas[i] = new Array(canvasSize);
            for (let k = 0; k < canvasSize; k++) {
                canvas[i][k] = defaultCanvasColor;
            }
        }
        canvas[pixelX][pixelY] = color;
        console.log(usernameOne, " and ", usernameTwo, " made a canvas with waiting for ", newUserWaitingOn);
        const createCanvasStmt = db.prepare("INSERT INTO canvases (id, username_one, username_two, canvas, waiting_on) VALUES (?, ?, ?, ?, ?);");
        createCanvasStmt.run(randomUUID().toString(), usernameOne, usernameTwo, canvasToDatabaseRepresentation(canvas), newUserWaitingOn);
        return true;
    } else if (canvasExists(usernameTwo, usernameOne, true)) {
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

export function makeUser(username: string, password: string) {
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?);");
    if (userExists(username)) {
        // We have the user, check their password
        const checkUserPasswordStmt = db.prepare(`SELECT password FROM users WHERE username=(?);`);
        const savedPassword = (checkUserPasswordStmt.get(username) as unknown as { password: string })?.password;
        
        if (password == savedPassword) {
            return createUserToken(username);
        }

        return "";
    }
    stmt.run(username, password);
    return createUserToken(username);
}

export function similarUsernames(username: string) {
    const stmt = db.prepare(`SELECT username FROM users WHERE username LIKE ?;`);
    const usernames = (stmt.all(`%${username}%`) as unknown as { username: string }[]).map(row => row.username);
    return usernames;
}

function createUserToken(username: string) {
    const stmt = db.prepare("INSERT INTO tokens (token, username) VALUES (?, ?);");
    const token = randomUUID();
    stmt.run(token, username);
    return token;
}

export function getUsernameFromToken(token: string) {
    const stmt = db.prepare(`SELECT username FROM tokens WHERE token = ?;`);
    return (stmt.get(token) as unknown as { username: string })?.username;
}

export function closeDatabase() {
    db.close();
}