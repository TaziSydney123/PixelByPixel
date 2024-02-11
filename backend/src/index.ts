import express from 'express';
import { getTurn, getCanvas, getContacts, getUsernameFromToken, signInOrSignUp, similarUsernames, writePixel, closeDatabase } from './database';
import cors from 'cors';
import process from 'node:process';

const app = express();
app.use(express.json());

app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}));

const port = 3000;

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const userToken = await signInOrSignUp(username, password);
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
        "usernames": await similarUsernames(username)
    });
});

app.post('/contacts', async (req, res) => {
    const { token } = req.body;
    const username = await getUsernameFromToken(token);
    res.status(200).json(await getContacts(username));
});

app.post("/pixel", async (req, res) => {
    const { pixelX, pixelY, token, contact, color} = req.body;
    // Color is in format #FFFFFF or #FE0B52 or etc.

    const username = await getUsernameFromToken(token);

    if (await writePixel(username, contact, pixelX, pixelY, color)) {
        res.status(200).json({ "message": "Success" })
    } else {
        res.status(500).json({ "message": "Failure" })
    }
});

app.post("/getCanvas", async (req, res) => {
    const { token, contact} = req.body;

    const username = await getUsernameFromToken(token);

    const canvas = await getCanvas(username, contact);
    
    if (canvas) {
        res.status(200).json({
            image: canvas,
            turn: await getTurn(username, contact)
        });
    } else {
        res.status(404).json({ "message": "Not found" });
    }
});

const server = app.listen(port);

process.stdin.resume(); // so the program will not close instantly

process.on('beforeExit', async (code) => {
    await closeDatabase();
    server.close();
});