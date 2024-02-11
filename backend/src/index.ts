import express from 'express';
import { getTurn, getCanvas, getContacts, getUsernameFromToken, makeUser, similarUsernames, writePixel } from './database';
import cors from 'cors';

const app = express();
app.use(express.json());

app.use(cors({
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "preflightContinue": false,
    "optionsSuccessStatus": 204
}));

const port = 3000;

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const userToken = makeUser(username, password);
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
        "usernames": similarUsernames(username)
    });
});

app.post('/contacts', (req, res) => {
    const { token } = req.body;
    const username = getUsernameFromToken(token);
    res.status(200).json(getContacts(username));
});

app.post("/pixel", (req, res) => {
    const { pixelX, pixelY, token, contact, color} = req.body;
    // Color is in format #FFFFFF or #FE0B52 or etc.

    const username = getUsernameFromToken(token);

    if (writePixel(username, contact, pixelX, pixelY, color)) {
        res.status(200).json({ "message": "Success" })
    } else {
        res.status(500).json({ "message": "Failure" })
    }
});

app.post("/getCanvas", (req, res) => {
    const { token, contact} = req.body;

    const username = getUsernameFromToken(token);

    const canvas = getCanvas(username, contact);
    
    if (canvas) {
        res.status(200).json({
            image: canvas,
            turn: getTurn(username, contact)
        });
    } else {        // TODO: 
        res.status(404).json({ "message": "Not found" });
    }
});

app.listen(port);